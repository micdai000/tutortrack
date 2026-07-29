import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import {
  deleteGoogleConnection,
  getGoogleConnection,
  getGoogleOAuthErrorMessage,
  startGoogleOAuth,
} from "../services/googleConnectionService";
import type { GoogleConnectionSummary } from "../types/googleConnection";
import { getErrorMessage } from "../utils/getErrorMessage";

type UseGoogleConnectionResult = {
  connection: GoogleConnectionSummary | null;
  isConnected: boolean;
  loading: boolean;
  connecting: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
};

/** Loads Google connection status and starts server-side OAuth. */
export function useGoogleConnection(): UseGoogleConnectionResult {
  const [connection, setConnection] = useState<GoogleConnectionSummary | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const handledRedirect = useRef(false);

  async function refresh(options?: { silent?: boolean }) {
    if (!options?.silent) {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await getGoogleConnection();
      setConnection(data);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load Google connection."));
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  // After Edge Function redirect, refresh status and clean the URL.
  useEffect(() => {
    if (handledRedirect.current) {
      return;
    }

    const oauthResult = searchParams.get("google_oauth");
    if (!oauthResult) {
      return;
    }

    handledRedirect.current = true;
    const oauthError = searchParams.get("google_oauth_error");

    void (async () => {
      setConnecting(false);

      if (oauthResult === "connected") {
        setLoading(true);
        try {
          const data = await getGoogleConnection();
          if (!data) {
            setConnection(null);
            setError(
              "Google authorization finished, but TutorTrack could not load the connection. Confirm you are signed into TutorTrack on the same site URL as SITE_URL, then refresh. Also check that migrations 016–017 ran and google_connections has a row."
            );
          } else {
            setConnection(data);
            setError(null);
          }
        } catch (err) {
          setError(
            getErrorMessage(err, "Connected, but unable to refresh status.")
          );
        } finally {
          setLoading(false);
        }
      } else {
        setError(getGoogleOAuthErrorMessage(oauthError));
        await refresh({ silent: true });
        setLoading(false);
      }

      navigate("/render-account", { replace: true });
    })();
  }, [searchParams, navigate]);

  async function connect() {
    setConnecting(true);
    setError(null);

    try {
      const authorizationUrl = await startGoogleOAuth();
      window.location.assign(authorizationUrl);
    } catch (err) {
      setConnecting(false);
      setError(
        getErrorMessage(err, "Unable to start Google authorization.")
      );
    }
  }

  async function disconnect() {
    await deleteGoogleConnection();
    setConnection(null);
  }

  return {
    connection,
    isConnected: connection !== null,
    loading,
    connecting,
    error,
    refresh,
    connect,
    disconnect,
  };
}
