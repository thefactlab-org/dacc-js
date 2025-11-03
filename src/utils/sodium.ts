import sodium from "libsodium-wrappers-sumo";

export const getSodium = async () => {
  await sodium.ready;
  return sodium;
};
