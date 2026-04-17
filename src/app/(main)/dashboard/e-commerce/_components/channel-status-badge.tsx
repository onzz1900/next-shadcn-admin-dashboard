"use client";

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import {
  type ChannelPrimaryStatusInput,
  getChannelPrimaryStatusMeta,
  getChannelStatusDetailMeta,
} from "../_lib/channel-status";
import type { PublicationStatus } from "../_lib/product-center.types";

interface ChannelStatusBadgeProps {
  status?: PublicationStatus;
  channelState?: ChannelPrimaryStatusInput;
  className?: string;
  showInlineNote?: boolean;
}

export function ChannelStatusBadge({
  status,
  channelState,
  className,
  showInlineNote = false,
}: ChannelStatusBadgeProps) {
  const resolvedState =
    channelState ??
    ({
      publicationStatus: status ?? "not_started",
      auditStatus: "not_submitted",
      listingStatus: "not_listed",
      missingFields: [],
    } satisfies ChannelPrimaryStatusInput);

  const config = getChannelPrimaryStatusMeta(resolvedState);
  const detail = getChannelStatusDetailMeta(resolvedState);
  const badge = (
    <Badge className={className} variant={config.variant}>
      {config.label}
    </Badge>
  );

  return (
    <div className="space-y-1">
      {detail.tooltip ? (
        <Tooltip>
          <TooltipTrigger asChild>{badge}</TooltipTrigger>
          <TooltipContent side="top">{detail.tooltip}</TooltipContent>
        </Tooltip>
      ) : (
        badge
      )}
      {showInlineNote && detail.inlineNote ? (
        <div className="max-w-32 truncate text-muted-foreground text-xs">{detail.inlineNote}</div>
      ) : null}
    </div>
  );
}
