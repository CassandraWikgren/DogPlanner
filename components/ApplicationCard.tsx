"use client";

import React, { useState } from "react";
import { Calendar, Phone, Eye, MessageCircle, Star, Check, X } from "lucide-react";
import { capitalize } from "@/lib/textUtils";
import {
  formatDate,
  getPriorityLabel,
  getVisitStatusLabel,
  getVisitResultLabel,
} from "@/lib/applicationUtils";

interface ApplicationCardProps {
  application: any;
  onUpdate: (id: string, updates: any) => Promise<void>;
}

export default function ApplicationCard({
  application,
  onUpdate,
}: ApplicationCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const priorityInfo = getPriorityLabel(application.priority);
  const visitStatusInfo = getVisitStatusLabel(application.visit_status);
  const visitResultInfo = getVisitResultLabel(application.visit_result);

  const handleQuickContact = async () => {
    setIsUpdating(true);
    await onUpdate(application.id, {
      first_contact_date: new Date().toISOString().split("T")[0],
      status: "contacted",
    });
    setIsUpdating(false);
  };

  const handleBookVisit = async () => {
    const date = prompt("Ange datum för visning (ÅÅÅÅ-MM-DD):");
    if (!date) return;

    setIsUpdating(true);
    await onUpdate(application.id, {
      visit_booked_date: date,
      visit_status: "booked",
    });
    setIsUpdating(false);
  };

  const handleCompleteVisit = async (result: string) => {
    setIsUpdating(true);
    await onUpdate(application.id, {
      visit_completed_date: new Date().toISOString().split("T")[0],
      visit_status: "completed",
      visit_result: result,
    });
    setIsUpdating(false);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {capitalize(application.dog_name)}
              </h3>
              {application.priority !== 0 && (
                <span
                  className={`px-2 py-0.5 text-xs font-medium rounded border ${priorityInfo.color}`}
                >
                  <Star className="h-3 w-3 inline mr-1" />
                  {priorityInfo.text}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600">
              {capitalize(application.dog_breed || "Okänd ras")} •{" "}
              {capitalize(application.parent_name)}
            </p>
          </div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-slate-700 hover:underline"
          >
            {showDetails ? "Dölj" : "Visa mer"}
          </button>
        </div>
      </div>

      {/* Timeline & Info */}
      <div className="p-4 space-y-3">
        {/* Önskat startdatum */}
        {application.preferred_start_date && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">Önskar börja:</span>
            <span className="font-medium text-gray-900">
              {formatDate(application.preferred_start_date)}
            </span>
          </div>
        )}

        {/* Första kontakt */}
        {application.first_contact_date ? (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-blue-500" />
            <span className="text-gray-600">Kontaktad:</span>
            <span className="font-medium text-gray-900">
              {formatDate(application.first_contact_date)}
            </span>
            {application.first_contact_notes && (
              <span className="text-gray-500 italic">
                ({application.first_contact_notes})
              </span>
            )}
          </div>
        ) : (
          <button
            onClick={handleQuickContact}
            disabled={isUpdating}
            className="flex items-center gap-2 text-sm text-slate-700 hover:text-slate-800 disabled:opacity-50"
          >
            <Phone className="h-4 w-4" />
            Markera som kontaktad
          </button>
        )}

        {/* Visning */}
        {application.visit_booked_date ? (
          <div className="flex items-center gap-2 text-sm">
            <Eye className="h-4 w-4 text-purple-500" />
            <span className="text-gray-600">Visning:</span>
            <span className="font-medium text-gray-900">
              {formatDate(application.visit_booked_date)}
            </span>
            <span
              className={`px-2 py-0.5 text-xs font-medium rounded border ${visitStatusInfo.color}`}
            >
              {visitStatusInfo.text}
            </span>
            {application.visit_result && (
              <span
                className={`px-2 py-0.5 text-xs font-medium rounded border ${visitResultInfo.color}`}
              >
                {visitResultInfo.text}
              </span>
            )}
          </div>
        ) : application.first_contact_date ? (
          <button
            onClick={handleBookVisit}
            disabled={isUpdating}
            className="flex items-center gap-2 text-sm text-slate-700 hover:text-slate-800 disabled:opacity-50"
          >
            <Calendar className="h-4 w-4" />
            Boka visning
          </button>
        ) : null}

        {/* Quick actions efter visning */}
        {application.visit_status === "booked" &&
          !application.visit_completed_date && (
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => handleCompleteVisit("approved")}
                disabled={isUpdating}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-50 text-green-700 rounded border border-green-200 hover:bg-green-100 disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                Godkänn
              </button>
              <button
                onClick={() => handleCompleteVisit("declined")}
                disabled={isUpdating}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-50 text-red-700 rounded border border-red-200 hover:bg-red-100 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
                Avböj
              </button>
              <button
                onClick={() => handleCompleteVisit("waiting")}
                disabled={isUpdating}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-yellow-50 text-yellow-700 rounded border border-yellow-200 hover:bg-yellow-100 disabled:opacity-50"
              >
                <MessageCircle className="h-4 w-4" />
                Väntar
              </button>
            </div>
          )}
      </div>

      {/* Expanded details */}
      {showDetails && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-100 space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-gray-600">Telefon:</span>
              <p className="font-medium">{application.parent_phone}</p>
            </div>
            <div>
              <span className="text-gray-600">E-post:</span>
              <p className="font-medium text-blue-600">
                {application.parent_email}
              </p>
            </div>
          </div>
          {application.preferred_days && (
            <div>
              <span className="text-gray-600">Önskade dagar:</span>
              <p className="font-medium">
                {application.preferred_days.join(", ")}
              </p>
            </div>
          )}
          {application.special_needs && (
            <div>
              <span className="text-gray-600">Specialbehov:</span>
              <p className="font-medium text-orange-600">
                {application.special_needs}
              </p>
            </div>
          )}
          {application.notes && (
            <div>
              <span className="text-gray-600">Anteckningar:</span>
              <p className="font-medium italic">{application.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
