"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/common/Toast";
import { CustomerMenuResponse } from "@/types";

interface WebSocketContextType {
  isConnected: boolean;
  activeToken: string | null;
  setActiveToken: (token: string) => void;
}

const WebSocketContext = createContext<WebSocketContextType>({
  isConnected: false,
  activeToken: null,
  setActiveToken: () => {},
});

export function WebSocketProvider({
  children,
  initialToken,
}: {
  children: React.ReactNode;
  initialToken?: string;
}) {
  const [activeToken, setActiveToken] = useState<string | null>(initialToken || null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const connect = useCallback(() => {
    if (!activeToken || typeof window === "undefined") return;

    if (socketRef.current) {
      socketRef.current.close();
    }

    const wsBase = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/api/v1/ws";
    const wsUrl = `${wsBase}/menu/${activeToken}`;

    try {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const { event: eventType, data } = payload;

          if (eventType === "MENU_ITEM_AVAILABILITY_CHANGED" && data) {
            const { menu_item_id, is_available } = data;

            // Direct cache update for instant UI flip without refetch lag
            queryClient.setQueryData<CustomerMenuResponse>(
              ["customer-menu", activeToken],
              (oldData) => {
                if (!oldData) return oldData;

                const updateList = (list: any[]) =>
                  list.map((item) =>
                    item.id === menu_item_id ? { ...item, is_available } : item
                  );

                return {
                  ...oldData,
                  menu_items: updateList(oldData.menu_items),
                  featured_items: updateList(oldData.featured_items),
                  popular_items: updateList(oldData.popular_items),
                  bestsellers: updateList(oldData.bestsellers),
                };
              }
            );

            // Also invalidate to sync any associated calculations and search results
            queryClient.invalidateQueries({ queryKey: ["customer-menu", activeToken] });
            queryClient.invalidateQueries({ queryKey: ["menu-search-dishes"] });

            // Display live toast notification on customer screen
            if (!is_available) {
              addToast({
                type: "warning",
                title: "Live Kitchen Update",
                message: `"${data.name || 'A menu selection'}" is currently sold out.`,
              });
            } else {
              addToast({
                type: "success",
                title: "Live Kitchen Update",
                message: `"${data.name || 'A menu selection'}" is back in stock!`,
              });
            }
          } else if (
            [
              "MENU_ITEM_CREATED",
              "MENU_ITEM_UPDATED",
              "MENU_ITEM_DELETED",
              "CATEGORY_UPDATED",
              "BANNER_UPDATED",
              "MENU_VERSION_UPDATED",
              "SETTINGS_UPDATED",
            ].includes(eventType)
          ) {
            queryClient.invalidateQueries({ queryKey: ["customer-menu", activeToken] });
            queryClient.invalidateQueries({ queryKey: ["customer-reviews"] });
          }
        } catch (err) {
          console.error("WebSocket message parsing error:", err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Attempt reconnection after 4s
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 4000);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch (e) {
      console.warn("WebSocket connection failure:", e);
    }
  }, [activeToken, queryClient]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) socketRef.current.close();
    };
  }, [connect]);

  return (
    <WebSocketContext.Provider value={{ isConnected, activeToken, setActiveToken }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useCustomerWebSocket() {
  return useContext(WebSocketContext);
}
