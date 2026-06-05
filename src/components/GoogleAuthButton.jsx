import { useCallback, useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { loginWithGoogle } from "../services/authService";
import { useUser } from "../contexts/UserContext";

function GoogleAuthButton({ onSuccess }) {
  const googleButtonRef = useRef(null);
  const [googleError, setGoogleError] = useState("");
  const { refreshUser } = useUser();

  const handleGoogleResponse = useCallback(async (response) => {
    try {
      if (!response?.credential) {
        setGoogleError("Gagal menerima kredensial Google.");
        return;
      }

      setGoogleError("");

      const { error, data, message } = await loginWithGoogle({
        credential: response.credential,
      });

      if (error) {
        setGoogleError(message || "Login Google gagal.");
        return;
      }

      localStorage.setItem("accessToken", data.accessToken);

      if (data.refreshToken) {
        localStorage.setItem("refreshToken", data.refreshToken);
      }

      await refreshUser();
      onSuccess?.();
    } catch (error) {
      console.error(error);
      setGoogleError("Login Google gagal.");
    }
  }, [onSuccess, refreshUser]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (!window.google) return;

      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
      });

      if (googleButtonRef.current) {
        googleButtonRef.current.innerHTML = "";

        window.google.accounts.id.renderButton(
          googleButtonRef.current,
          {
            theme: "outline",
            size: "large",
            width: "100%",
            text: "continue_with",
          },
        );
      }

      clearInterval(intervalId);
    }, 500);

    return () => clearInterval(intervalId);
  }, [handleGoogleResponse]);

  return (
    <div className="flex flex-col gap-2">
      <div ref={googleButtonRef}></div>

      {googleError && (
        <p className="text-sm text-red-500">
          {googleError}
        </p>
      )}
    </div>
  );
}

GoogleAuthButton.propTypes = {
  onSuccess: PropTypes.func,
};

export default GoogleAuthButton;
