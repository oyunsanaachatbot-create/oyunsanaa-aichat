import type { Attachment } from "@/lib/types";
import { Loader } from "./elements/loader";
import { CrossSmallIcon } from "./icons";
import { Button } from "./ui/button";

function isLikelyImage(url?: string, contentType?: string) {
  if (contentType?.startsWith("image/")) return true;
  const u = (url || "").toLowerCase().split("?")[0]; // signed url/query safe
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(u);
}

export const PreviewAttachment = ({
  attachment,
  isUploading = false,
  onRemove,
}: {
  attachment: Attachment;
  isUploading?: boolean;
  onRemove?: () => void;
}) => {
  const { name, url, contentType } = attachment;

  const showImage = isLikelyImage(url, contentType);

  return (
    <div
      className="group relative size-16 overflow-hidden rounded-lg border bg-muted"
      data-testid="input-attachment-preview"
    >
      {showImage ? (
        <img
          src={url}
          alt={name ?? "Image attachment"}
          className="size-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex size-full items-center justify-center text-muted-foreground text-xs">
          File
        </div>
      )}

      {isUploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <Loader size={16} />
        </div>
      )}

      {onRemove && !isUploading && (
        <Button
       className="absolute top-0.5 right-0.5 size-5 rounded-full p-0 opacity-100 md:opacity-0 md:transition-opacity md:group-hover:opacity-100"

          onClick={onRemove}
          size="sm"
          variant="destructive"
        >
          <CrossSmallIcon size={8} />
        </Button>
      )}

      <div className="absolute inset-x-0 bottom-0 truncate bg-linear-to-t from-black/80 to-transparent px-1 py-0.5 text-[10px] text-white">
        {name}
      </div>
    </div>
  );
};
