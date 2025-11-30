import React from 'react'
import { UploadLeadsClient } from './UploadLeadsClient'

export default function UploadLeadsPage() {
  return (
    <div>
      <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Upload Leads</h1>
        <p className="text-muted-foreground mt-1">
          Upload your lead list in CSV format to start the AI qualification process.
        </p>
      </div>
      <UploadLeadsClient/>
    </div>
    </div>
  )
}
