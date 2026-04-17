import type { ChannelId } from "../../../_lib/product-center.types";

export function getChannelStatusSectionId(channelId: ChannelId) {
  return `channel-${channelId}-status`;
}

export function getChannelEditorSectionId(channelId: ChannelId) {
  return `channel-${channelId}-editor`;
}

export function getChannelActionSectionId(channelId: ChannelId) {
  return `channel-${channelId}-actions`;
}
