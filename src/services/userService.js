import api from "./api";

export async function getProfile() {
  try {
    const response = await api.get("/profiles/me");
    return {
      error: false,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    return {
      error: true,
      message:
        error.response?.data?.message ||
        error.message ||
        "Gagal memuat profil",
    };
  }
}

