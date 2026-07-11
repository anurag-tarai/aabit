export const showErrorToast = (message: string) => {
  window.dispatchEvent(
    new CustomEvent('api-error', { 
      detail: { message } 
    })
  );
};
