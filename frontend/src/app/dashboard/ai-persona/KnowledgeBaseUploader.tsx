import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, UploadCloud, X } from 'lucide-react';

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}


type KnowledgeBaseUploaderProps = {
  stagedFile: File | null;
  isUploading: boolean; 
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onClear: () => void;
  onUpload: () => void; 
};

export default function KnowledgeBaseUploader({
  stagedFile,
  isUploading,
  fileInputRef,
  onFileChange,
  onDrop,
  onDragOver,
  onClear,
  onUpload, 
}: KnowledgeBaseUploaderProps) {
  const onSelectFilesClick = () => fileInputRef.current?.click();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Knowledge Base</CardTitle>
        <CardDescription>Upload documents for the AI to learn from. (PDF only, max 25MB)</CardDescription>
      </CardHeader>
      <CardContent>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={onFileChange}
        />
        {!stagedFile ? (
          <div
            className="p-8 text-center border-2 border-dashed rounded-lg cursor-pointer"
            onClick={onSelectFilesClick}
            onDrop={onDrop}
            onDragOver={onDragOver}
          >
            <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">Click to select or drag a PDF</h3>
            <p className="mt-1 text-sm text-muted-foreground">Max 25MB</p>
          </div>
        ) : (
          <div className="space-y-3">
            <h4 className="font-medium">File Ready</h4>
            <div className="flex items-center justify-between p-3 rounded-md border">
              <div className="flex items-center gap-3 overflow-hidden">
                <FileText className="h-5 w-5" />
                <span className="truncate" title={stagedFile.name}>{stagedFile.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">{formatBytes(stagedFile.size)}</span>
                <Button variant="ghost" size="icon" onClick={onClear} disabled={isUploading}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {/* **RE-INTRODUCED**: Standalone button to trigger the upload via the onUpload prop */}
            <div className="mt-4 flex gap-2">
              <Button onClick={onUpload} disabled={isUploading || !stagedFile}>
                {isUploading ? 'Uploading...' : 'Send PDF to n8n'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}