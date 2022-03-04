import formData from 'isomorphic-form-data';
let isBrowser = false;

(async function () {
  try {
    isBrowser = true;
    let funny = window.FormData;
  } catch (error) {
    isBrowser = false;
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
