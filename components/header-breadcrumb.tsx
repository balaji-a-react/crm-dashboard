"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

const ROOT_LABEL = "CRM Dashboard"

const SEGMENT_LABELS: Record<string, string> = {
  customers: "Customers",
}

function segmentLabel(segment: string, index: number): string {
  if (SEGMENT_LABELS[segment]) {
    return SEGMENT_LABELS[segment]
  }
  if (/^\d+$/.test(segment)) {
    return "Customer Details"
  }
  return segment.charAt(0).toUpperCase() + segment.slice(1)
}

export function HeaderBreadcrumb() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className={segments.length > 0 ? "hidden md:block" : undefined}>
          {segments.length === 0 ? (
            <BreadcrumbPage>{ROOT_LABEL}</BreadcrumbPage>
          ) : (
            <BreadcrumbLink render={<Link href="/" />}>{ROOT_LABEL}</BreadcrumbLink>
          )}
        </BreadcrumbItem>
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1
          const href = `/${segments.slice(0, index + 1).join("/")}`
          return (
            <React.Fragment key={href}>
              <BreadcrumbSeparator
                className={index === 0 ? "hidden md:block" : undefined}
              />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{segmentLabel(segment, index)}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink render={<Link href={href} />}>
                    {segmentLabel(segment, index)}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
