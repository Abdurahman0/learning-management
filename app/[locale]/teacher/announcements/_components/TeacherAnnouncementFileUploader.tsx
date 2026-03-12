"use client";

import {useRef, useState, type DragEvent} from "react";
import {FileUp, X} from "lucide-react";
import {useTranslations} from "next-intl";

import {Button} from "@/components/ui/button";
import type {TeacherAnnouncementAttachment} from "@/types/teacher";

type TeacherAnnouncementFileUploaderProps = {
  value?: TeacherAnnouncementAttachment;
  onChange: (value?: TeacherAnnouncementAttachment) => void;
};

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

function mapExtensionToType(extension: string): TeacherAnnouncementAttachment["fileType"] | null {
  if (extension === "pdf") {
    return "pdf";
  }

  if (extension === "docx") {
    return "docx";
  }

  if (extension === "jpg" || extension === "jpeg") {
    return "jpg";
  }

  return null;
}

export function TeacherAnnouncementFileUploader({value, onChange}: TeacherAnnouncementFileUploaderProps) {
  const t = useTranslations("teacherAnnouncements");
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (file: File) => {
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    const fileType = mapExtensionToType(extension);

    if (!fileType) {
      setError(t("uploader.unsupportedType"));
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(t("uploader.fileTooLarge"));
      return;
    }

    setError(null);
    onChange({
      fileName: file.name,
      fileType,
      fileSizeBytes: file.size
    });
  };

  const handleFileInput = (fileList: FileList | null) => {
    if (!fileList?.length) {
      return;
    }

    handleFile(fileList[0]);
  };

  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setDragging(false);
    handleFileInput(event.dataTransfer.files);
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(event) => event.preventDefault()}
        onDragEnter={() => setDragging(true)}
        onDragLeave={() => setDragging(false)}
        className={`w-full rounded-xl border border-dashed px-4 py-8 text-center transition-colors ${dragging ? "border-primary/60 bg-primary/10" : "border-border/70 bg-background/30 hover:bg-muted/20"}`}
      >
        <span className="inline-flex size-10 items-center justify-center rounded-full border border-border/70 bg-background/55 text-muted-foreground">
          <FileUp className="size-5" />
        </span>
        <p className="mt-3 text-sm font-medium">{t("uploader.dropOrClick")}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t("uploader.supported")}</p>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.jpg,.jpeg"
        className="hidden"
        onChange={(event) => handleFileInput(event.target.files)}
      />

      {value ? (
        <div className="flex items-center justify-between rounded-lg border border-border/70 bg-background/45 px-3 py-2 text-sm">
          <div className="min-w-0">
            <p className="truncate font-medium">{value.fileName}</p>
            <p className="text-xs text-muted-foreground">
              {(value.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>

          <Button type="button" size="icon" variant="ghost" className="size-8 rounded-md" onClick={() => onChange(undefined)}>
            <X className="size-4" />
            <span className="sr-only">{t("uploader.removeFile")}</span>
          </Button>
        </div>
      ) : null}

      {error ? <p className="text-xs text-rose-400">{error}</p> : null}
    </div>
  );
}
