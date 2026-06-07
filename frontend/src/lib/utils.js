export const capitialize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

export const getApiErrorMessage = (error) => {
  return error?.response?.data?.message || error?.message || "Something went wrong";
};