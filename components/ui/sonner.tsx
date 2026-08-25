"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      // Required for sonner to consume the per-type --success/--error/
      // --warning CSS vars below; without it every type renders "normal".
      richColors
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",

          // Per-type theming: tinted bg, colored text/icon, accent border.
          // Tokens live in globals.css so they flip with light/dark theme.
          "--success-bg":
            "color-mix(in oklab, var(--success) 10%, var(--popover))",
          "--success-text": "var(--success-foreground)",
          "--success-border":
            "color-mix(in oklab, var(--success) 40%, var(--popover))",

          "--error-bg":
            "color-mix(in oklab, var(--destructive) 10%, var(--popover))",
          "--error-text": "var(--destructive)",
          "--error-border":
            "color-mix(in oklab, var(--destructive) 40%, var(--popover))",

          "--warning-bg":
            "color-mix(in oklab, var(--warning) 14%, var(--popover))",
          "--warning-text": "var(--warning-foreground)",
          "--warning-border":
            "color-mix(in oklab, var(--warning) 45%, var(--popover))",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
