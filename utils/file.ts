
export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // result is "data:image/jpeg;base64,..."
          // we need to strip the prefix
          resolve(reader.result.split(',')[1]);
        } else {
          reject(new Error("Failed to read file as base64 string."));
        }
      };
      reader.onerror = (error) => reject(error);
    });
  };
