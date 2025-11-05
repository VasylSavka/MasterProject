import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { confirmMembership } from "../appwrite/teams";
import { account } from "../appwrite/client";
import { syncUserToDatabase } from "../appwrite/database";

export default function ConfirmInvite() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const teamId = params.get("teamId");
    const membershipId = params.get("membershipId");
    const userId = params.get("userId");
    const secret = params.get("secret");

    if (!teamId || !membershipId || !userId || !secret) {
      toast.error("❌ Неправильне або неповне посилання запрошення.");
      navigate("/");
      return;
    }

    async function confirm() {
      toast.loading("⏳ Підтвердження запрошення...");
      try {
        await confirmMembership(teamId, membershipId, userId, secret);
        toast.dismiss();
        toast.success("✅ Ви успішно приєдналися до команди!");
        const currentUser = await account.get();
        await syncUserToDatabase(currentUser);
        navigate("/dashboard");
      } catch (err) {
        toast.dismiss();
        console.error("Помилка підтвердження:", err);
        toast.error("❌ Не вдалося підтвердити запрошення.");
      }
    }

    confirm();
  }, [params, navigate]);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow text-center">
        <h2 className="text-xl font-semibold mb-2">Підтвердження запрошення</h2>
        <p className="text-gray-600">Будь ласка, зачекайте...</p>
      </div>
    </div>
  );
}
