let formData: typeof FormData;
let isBrowser = false;

(async function () {
  try {
    formData = window.FormData as any;
    isBrowser = true;
  } catch (error) {
    let a = await import('form-data');
    formData = a.default as any;
  }
})();

export default function toFormData(
  data: Buffer | ArrayBuffer | File | Blob,
  filename: string = 'thing'
) {
  const FormDataBody = new formData();
  if (isBrowser) {
    if (data instanceof File) {
      FormDataBody.append('file', data);
      return FormDataBody;
    }
    if (data instanceof ArrayBuffer) {
      let leFile = new File([data], filename);
      FormDataBody.append('file', leFile);
      return FormDataBody;
    }
    if (data instanceof Blob) {
      let leFile = new File([data], filename);
      FormDataBody.append('file', leFile);
      return FormDataBody;
    }
  } else {
    FormDataBody.append('file', data as any, filename);
    return FormDataBody;
  }
}
