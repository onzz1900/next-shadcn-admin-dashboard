"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type { AssetItem } from "../../../_lib/product-center.types";

interface ChannelAssetPickerDialogProps {
  assets: AssetItem[];
  assetTypes?: readonly AssetItem["type"][];
  selectionMode?: "single" | "multiple";
  value: string | string[];
  placeholder: string;
  onSelect: (value: string | string[]) => void;
}

const assetTypeLabel: Record<AssetItem["type"], string> = {
  cover: "封面",
  gallery: "组图",
  detail: "详情",
};

const assetStatusLabel: Record<AssetItem["status"], string> = {
  ready: "可用",
  missing: "缺失",
};

export function ChannelAssetPickerDialog({
  assets,
  assetTypes,
  selectionMode = "single",
  value,
  placeholder,
  onSelect,
}: ChannelAssetPickerDialogProps) {
  const [open, setOpen] = useState(false);
  const [draftSelection, setDraftSelection] = useState<string[]>([]);
  const filteredAssets = useMemo(
    () => assets.filter((asset) => !assetTypes?.length || assetTypes.includes(asset.type)),
    [assetTypes, assets],
  );
  const selectedAssetIds = useMemo(() => (Array.isArray(value) ? value : value ? [value] : []), [value]);
  const selectedAssets = filteredAssets.filter(
    (asset) => selectedAssetIds.includes(asset.id) && asset.status === "ready",
  );
  const selectedAsset = selectedAssets[0];
  const buttonLabel =
    selectionMode === "multiple"
      ? selectedAssets.length > 0
        ? `${selectedAssets.length} 个素材`
        : placeholder
      : (selectedAsset?.label ?? placeholder);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (nextOpen && selectionMode === "multiple") {
      setDraftSelection(selectedAssetIds);
    }
  };

  const commitSelection = (nextValue: string | string[]) => {
    onSelect(nextValue);
    setOpen(false);
  };

  return (
    <>
      <Button type="button" variant="outline" className="w-full justify-between" onClick={() => handleOpenChange(true)}>
        <span className="truncate">{buttonLabel}</span>
        <Badge variant={selectedAssets.length > 0 ? "outline" : "secondary"}>
          {selectionMode === "multiple"
            ? selectedAssets.length > 0
              ? "已选择"
              : "未选择"
            : selectedAsset
              ? assetTypeLabel[selectedAsset.type]
              : "未选择"}
        </Badge>
      </Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>选择素材</DialogTitle>
            <DialogDescription>
              仅使用当前商品已有素材，不触发真实上传。
              {selectionMode === "multiple" ? " 可多选后统一确认。" : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="grid max-h-[420px] gap-3 overflow-y-auto pr-1">
            {filteredAssets.length > 0 ? (
              filteredAssets.map((asset) => {
                const active =
                  selectionMode === "multiple"
                    ? draftSelection.includes(asset.id)
                    : selectedAssetIds.includes(asset.id);
                const disabled = asset.status !== "ready";

                return (
                  <button
                    key={asset.id}
                    type="button"
                    disabled={disabled}
                    aria-disabled={disabled}
                    onClick={() => {
                      if (disabled) {
                        return;
                      }

                      if (selectionMode === "multiple") {
                        setDraftSelection((currentSelection) =>
                          currentSelection.includes(asset.id)
                            ? currentSelection.filter((item) => item !== asset.id)
                            : [...currentSelection, asset.id],
                        );
                        return;
                      }

                      commitSelection(asset.id);
                    }}
                    className="flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left transition-colors hover:bg-muted/50 disabled:cursor-not-allowed disabled:border-dashed disabled:opacity-55 disabled:hover:bg-transparent"
                  >
                    <div className="space-y-1">
                      <div className="font-medium text-sm">{asset.label}</div>
                      <div className="text-muted-foreground text-xs">
                        素材 ID：{asset.id}
                        {disabled ? " · 当前不可用" : ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={asset.status === "ready" ? "outline" : "destructive"}>
                        {assetStatusLabel[asset.status]}
                      </Badge>
                      <Badge variant={active && !disabled ? "default" : "secondary"}>
                        {disabled
                          ? "不可选择"
                          : active
                            ? selectionMode === "multiple"
                              ? "已加入"
                              : "已选中"
                            : assetTypeLabel[asset.type]}
                      </Badge>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="rounded-lg border border-dashed px-4 py-8 text-center text-muted-foreground text-sm">
                当前商品没有可用素材。
              </div>
            )}
          </div>
          <DialogFooter>
            {selectedAssetIds.length > 0 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  commitSelection(selectionMode === "multiple" ? [] : "");
                }}
              >
                清空选择
              </Button>
            ) : null}
            {selectionMode === "multiple" ? (
              <Button type="button" onClick={() => commitSelection(draftSelection)}>
                确认选择
              </Button>
            ) : null}
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
