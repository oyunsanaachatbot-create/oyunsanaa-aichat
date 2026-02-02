"use client";

import { ArrowLeft, MessageCircle } from "lucide-react";

export default function TopBar() {
  return (
    <div className="relTopBar">
      {/* Back: зөвхөн сум */}
      <button
        type="button"
        className="relBackBtn"
        aria-label="Буцах"
        onClick={() => {
          // Таны TestRunner сонсдог event (өмнөх чинь яг энэ байсан)
          window.dispatchEvent(new Event("relations-tests-back"));
        }}
      >
        <ArrowLeft size={18} />
      </button>

      {/* Chat: pill style */}
      <button
        type="button"
        className="relChatBtn"
        onClick={() => {
          // Танайд чат нээдэг эвент/логик байвал эндээ холбоно.
          // Одоохондоо "чат" UI toggle хийдэг эвент гэж үзлээ:
          window.dispatchEvent(new Event("open-chat"));
        }}
      >
        <MessageCircle size={16} />
        <span>Чат</span>
      </button>
    </div>
  );
}
