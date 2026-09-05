"use client";

import { ImagePlus, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useId, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

const MAX_MB = 5;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

type SignResponse = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
};

/**
 * Drag-and-drop image field. Uploads straight to Cloudinary using a signature
 * minted by /api/cloudinary/sign, so the file never passes through this app.
 */
export function UploadInput({
  value,
  onChange,
  kind = "misc",
  label,
  className,
  disabled = false,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  /** Groups uploads into a Cloudinary subfolder (schools, questions, …). */
  kind?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
}) {
  const t = useTranslations("upload");
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

  async function upload(file: File) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error(t("wrongType"));
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(t("tooLarge", { size: MAX_MB }));
      return;
    }

    setUploading(true);
    try {
      const signResponse = await fetch("/api/cloudinary/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, contentType: file.type, size: file.size }),
      });
      if (!signResponse.ok) throw new Error("sign_failed");
      const sign = (await signResponse.json()) as SignResponse;

      const form = new FormData();
      form.append("file", file);
      form.append("api_key", sign.apiKey);
      form.append("timestamp", String(sign.timestamp));
      form.append("folder", sign.folder);
      form.append("signature", sign.signature);

      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`,
        { method: "POST", body: form },
      );
      if (!uploadResponse.ok) throw new Error("upload_failed");

      const result = (await uploadResponse.json()) as { secure_url?: string };
      if (!result.secure_url) throw new Error("upload_failed");

      onChange(result.secure_url);
    } catch {
      toast.error(t("failed"));
    } finally {
      setUploading(false);
      // Allow re-picking the same file after a failure.
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  if (value) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="relative aspect-video w-full overflow-hidden rounded-xl border bg-muted">
          <Image
            src={value}
            alt={label ?? ""}
            fill
            sizes="(max-width: 640px) 100vw, 24rem"
            className="object-cover"
          />
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? <Spinner /> : <Upload className="size-4" />}
            {t("replace")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled || uploading}
            onClick={() => onChange(null)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="size-4" />
            {t("remove")}
          </Button>
        </div>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={ALLOWED_TYPES.join(",")}
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
          }}
        />
      </div>
    );
  }

  return (
    <div className={className}>
      <label
        htmlFor={inputId}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          const file = event.dataTransfer.files?.[0];
          if (file) void upload(file);
        }}
        className={cn(
          "flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/30 px-4 text-center transition-colors",
          dragging
            ? "border-brand bg-brand/10"
            : "hover:border-muted-foreground/40 hover:bg-muted/50",
          (disabled || uploading) && "pointer-events-none opacity-60",
        )}
      >
        {uploading ? (
          <>
            <Spinner className="size-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{t("uploading")}</span>
          </>
        ) : (
          <>
            <span className="grid size-10 place-items-center rounded-full bg-background text-muted-foreground shadow-sm">
              <ImagePlus className="size-[1.15rem]" aria-hidden />
            </span>
            <span className="text-sm font-medium">{t("dropHere")}</span>
            <span className="text-xs text-muted-foreground">{t("orBrowse")}</span>
          </>
        )}
      </label>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        disabled={disabled || uploading}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
        }}
      />
    </div>
  );
}
