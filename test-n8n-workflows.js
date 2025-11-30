#!/usr/bin/env node

/**
 * n8n Workflow Automation Test Script
 * Tests and validates n8n workflows in echo123-workflows directory
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');

class N8nWorkflowTester {
  constructor(workflowsDir) {
    this.workflowsDir = workflowsDir;
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      warnings: 0,
      workflows: []
    };
  }

  async loadWorkflows() {
    const workflowPath = path.join(this.workflowsDir, 'echo123-workflows');
    const files = await fs.readdir(workflowPath);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    
    console.log(`\n📁 Found ${jsonFiles.length} workflow files\n`);
    
    const workflows = [];
    for (const file of jsonFiles) {
      try {
        const content = await fs.readFile(path.join(workflowPath, file), 'utf8');
        const workflow = JSON.parse(content);
        workflows.push({ file, workflow });
      } catch (error) {
        console.error(`❌ Failed to load ${file}: ${error.message}`);
      }
    }
    
    return workflows;
  }

  validateWorkflow(workflow, filename) {
    const issues = [];
    const warnings = [];
    
    // Check required fields
    if (!workflow.name) {
      issues.push('Missing workflow name');
    }
    
    if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
      issues.push('Missing or invalid nodes array');
      return { valid: false, issues, warnings };
    }
    
    if (workflow.nodes.length === 0) {
      warnings.push('Workflow has no nodes');
    }
    
    // Validate nodes
    workflow.nodes.forEach((node, idx) => {
      if (!node.name) {
        issues.push(`Node ${idx} missing name`);
      }
      if (!node.type) {
        issues.push(`Node ${idx} missing type`);
      }
      if (!node.parameters) {
        warnings.push(`Node ${node.name || idx} missing parameters`);
      }
    });
    
    // Check for credentials
    const credentialNodes = workflow.nodes.filter(n => 
      n.credentials && Object.keys(n.credentials).length > 0
    );
    
    if (credentialNodes.length > 0) {
      warnings.push(`${credentialNodes.length} nodes require credentials`);
    }
    
    // Validate connections
    if (workflow.connections) {
      const nodeNames = workflow.nodes.map(n => n.name);
      Object.keys(workflow.connections).forEach(source => {
        if (!nodeNames.includes(source)) {
          issues.push(`Connection references non-existent node: ${source}`);
        }
      });
    }
    
    // Check for webhook triggers
    const webhookNodes = workflow.nodes.filter(n => 
      n.type === 'n8n-nodes-base.webhook' || 
      n.type === 'n8n-nodes-base.facebookTrigger'
    );
    
    if (webhookNodes.length > 0) {
      warnings.push(`Contains ${webhookNodes.length} webhook/trigger nodes`);
    }
    
    return {
      valid: issues.length === 0,
      issues,
      warnings,
      stats: {
        nodeCount: workflow.nodes.length,
        credentialCount: credentialNodes.length,
        webhookCount: webhookNodes.length
      }
    };
  }

  async testWorkflow(workflowData) {
    const { file, workflow } = workflowData;
    const result = {
      file,
      name: workflow.name || 'Unnamed',
      status: 'unknown',
      issues: [],
      warnings: [],
      stats: {}
    };
    
    console.log(`\n🔍 Testing: ${result.name} (${file})`);
    
    try {
      const validation = this.validateWorkflow(workflow, file);
      
      result.issues = validation.issues;
      result.warnings = validation.warnings;
      result.stats = validation.stats;
      
      if (validation.valid) {
        console.log(`  ✅ Valid workflow`);
        console.log(`  📊 Nodes: ${validation.stats.nodeCount}`);
        result.status = 'passed';
        this.results.passed++;
      } else {
        console.log(`  ❌ Validation failed`);
        validation.issues.forEach(issue => {
          console.log(`     • ${issue}`);
        });
        result.status = 'failed';
        this.results.failed++;
      }
      
      if (validation.warnings.length > 0) {
        console.log(`  ⚠️  Warnings:`);
        validation.warnings.forEach(warning => {
          console.log(`     • ${warning}`);
        });
        this.results.warnings += validation.warnings.length;
      }
      
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
      result.status = 'error';
      result.issues.push(error.message);
      this.results.failed++;
    }
    
    this.results.total++;
    this.results.workflows.push(result);
    
    return result;
  }

  async runTests() {
    console.log('🚀 n8n Workflow Test Suite\n');
    console.log('=' .repeat(50));
    
    try {
      const workflows = await this.loadWorkflows();
      
      for (const workflowData of workflows) {
        await this.testWorkflow(workflowData);
      }
      
      this.printSummary();
      this.saveReport();
      
      return this.results;
      
    } catch (error) {
      console.error(`\n❌ Test suite failed: ${error.message}`);
      process.exit(1);
    }
  }

  printSummary() {
    console.log('\n' + '='.repeat(50));
    console.log('\n📋 Test Summary\n');
    console.log(`Total Workflows:  ${this.results.total}`);
    console.log(`✅ Passed:        ${this.results.passed}`);
    console.log(`❌ Failed:        ${this.results.failed}`);
    console.log(`⚠️  Warnings:      ${this.results.warnings}`);
    
    const passRate = this.results.total > 0 
      ? ((this.results.passed / this.results.total) * 100).toFixed(1) 
      : 0;
    console.log(`\n📊 Pass Rate:     ${passRate}%\n`);
    
    if (this.results.failed > 0) {
      console.log('\n❌ Failed Workflows:');
      this.results.workflows
        .filter(w => w.status === 'failed' || w.status === 'error')
        .forEach(w => {
          console.log(`  • ${w.name} (${w.file})`);
        });
    }
  }

  async saveReport() {
    const reportPath = path.join(this.workflowsDir, 'test-report.json');
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.results.total,
        passed: this.results.passed,
        failed: this.results.failed,
        warnings: this.results.warnings
      },
      workflows: this.results.workflows
    };
    
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n💾 Report saved to: ${reportPath}\n`);
  }
}

// CLI execution
if (require.main === module) {
  const workflowsDir = process.argv[2] || path.join(__dirname, 'echo123-workflows');
  
  const tester = new N8nWorkflowTester(workflowsDir);
  
  tester.runTests()
    .then(results => {
      process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = N8nWorkflowTester;
