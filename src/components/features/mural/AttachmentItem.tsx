import { useQuery } from "@tanstack/react-query";
import { Image as ImageIcon, FileText, Paperclip, Download, ExternalLink } from "lucide-react";
import { storageService } from "@/services/storage.service";

interface AttachmentItemProps {
  attachment: {
    id: string;
    file_name: string;
    content_type: string;
    file_path: string;
  };
}

export function AttachmentItem({ attachment }: AttachmentItemProps) {
  const { data: urlData } = useQuery({
    queryKey: ["downloadUrl", attachment.file_path],
    queryFn: () => storageService.getDownloadUrl(attachment.file_path),
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const downloadUrl = urlData?.download_url;
  const isImage = attachment.content_type.startsWith("image/");
  const isPdf = attachment.content_type === "application/pdf";

  if (isImage) {
    return (
      <div className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border/50 bg-muted transition-all hover:ring-2 hover:ring-primary/20">
        {downloadUrl ? (
          <img
            src={downloadUrl}
            alt={attachment.file_name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageIcon className="h-5 w-5 text-muted-foreground/30 animate-pulse" />
          </div>
        )}
        
        <a
          href={downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
        >
          <ExternalLink className="h-5 w-5 text-white" />
        </a>
      </div>
    );
  }

  return (
    <a
      href={downloadUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-3 text-sm transition-all hover:bg-muted hover:shadow-sm"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {isPdf ? (
          <FileText className="h-5 w-5" />
        ) : (
          <Paperclip className="h-5 w-5" />
        )}
      </div>
      <div className="flex flex-col min-w-0">
        <span className="truncate max-w-[120px] font-medium text-foreground/90">
          {attachment.file_name}
        </span>
        <span className="text-[10px] text-muted-foreground uppercase">
          {attachment.content_type.split("/")[1]}
        </span>
      </div>
      <Download className="ml-2 h-4 w-4 text-muted-foreground/40 transition-colors hover:text-primary" />
    </a>
  );
}
