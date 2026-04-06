import { AttachmentItem } from "./AttachmentItem";

interface AttachmentListProps {
  attachments: {
    id: string;
    file_name: string;
    content_type: string;
    file_path: string;
  }[];
}

export function AttachmentList({ attachments }: AttachmentListProps) {
  if (!attachments.length) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2.5">
      {attachments.map((att) => (
        <AttachmentItem key={att.id} attachment={att} />
      ))}
    </div>
  );
}
