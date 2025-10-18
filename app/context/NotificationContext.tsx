"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  priority?: "low" | "medium" | "high";
  read: boolean;
  actionUrl?: string;
  createdAt: Date;
  timestamp: Date;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (
    type: Notification["type"],
    title: string,
    message?: string,
    actionUrl?: string
  ) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addNotification = (
    type: Notification["type"],
    title: string,
    message?: string,
    actionUrl?: string
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    const now = new Date();
    const newNotification: Notification = {
      id,
      type,
      title,
      message: message || title,
      priority: type === "error" ? "high" : "medium",
      read: false,
      actionUrl,
      createdAt: now,
      timestamp: now,
    };

    setNotifications((prev) => [newNotification, ...prev]);

    // Auto-remove efter 5 sekunder för success/info
    if (type === "success" || type === "info") {
      setTimeout(() => {
        removeNotification(id);
      }, 5000);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        removeNotification,
        markAsRead,
        markAllAsRead,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
}
