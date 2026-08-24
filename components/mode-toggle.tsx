"use client"

import * as React from "react"
import { MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ModeToggle({ ...props }: React.ComponentProps<"div">) {
  const { resolvedTheme, setTheme } = useTheme()

  const toggleTheme = () =>
    setTheme(resolvedTheme === "dark" ? "light" : "dark")

  return (
    <div {...props}>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={toggleTheme}
        title="Toggle theme"
      >
        <SunIcon className="transition-transform duration-300 dark:-rotate-90 dark:scale-0" />
        <MoonIcon className="absolute transition-transform duration-300 rotate-90 scale-0 dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    </div>
  )
}
