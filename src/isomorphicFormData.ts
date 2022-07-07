let isBrowser: boolean;

(async function () {
  if (typeof window !== "undefined") isBrowser = true;
  else isBrowser = false;
})();

export default async function toFormData(
  data: string | Blob | File | Buffer | ArrayBuffer,
  filename?: string
): Promise<FormData> {
  if (isBrowser) {
    const formData = new FormData();
    if (typeof data === "string") {
      formData.append("file", new Blob([data]), filename || "file.txt");
    } else if (data instanceof Blob && !(data instanceof File)) {
      formData.append("file", data, filename || "file.bin");
    } else if (data instanceof File) {
      formData.append("file", data, filename || data.name);
    } else if (data instanceof ArrayBuffer) {
      formData.append("file", new Blob([data]), filename || "file.bin");
    } else {
      throw new Error("Unsupported data type");
    }

    return formData;
  } else {
    const FormData = (await import("form-data")).default;
    const formData = new FormData();
    if (typeof data === "string") {
      formData.append("file", data, filename || "file.txt");
    } else if (data instanceof Buffer) {
      formData.append("file", data, filename || "file.bin");
    } else {
      throw new Error("Unsupported data type");
    }

    return formData as any;
  }
}
