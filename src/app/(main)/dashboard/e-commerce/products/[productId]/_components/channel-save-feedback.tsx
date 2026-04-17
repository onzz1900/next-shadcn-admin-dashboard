"use client";

import { AlertCircleIcon, CheckCircle2Icon, Clock3Icon, PencilLineIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ChannelSaveFeedbackProps {
  hasUnsavedChanges: boolean;
  hasValidationErrors: boolean;
  validationErrorCount: number;
  didSave: boolean;
  lastSavedAt: string;
}

export function ChannelSaveFeedback({
  hasUnsavedChanges,
  hasValidationErrors,
  validationErrorCount,
  didSave,
  lastSavedAt,
}: ChannelSaveFeedbackProps) {
  if (hasValidationErrors) {
    return (
      <Alert variant="destructive">
        <AlertCircleIcon />
        <AlertTitle>有校验错误</AlertTitle>
        <AlertDescription>{validationErrorCount} 个字段需要修正后才能保存。</AlertDescription>
      </Alert>
    );
  }

  if (hasUnsavedChanges) {
    return (
      <Alert>
        <PencilLineIcon />
        <AlertTitle>有未保存修改</AlertTitle>
        <AlertDescription>表单内容已经更新，点击“保存字段”后会写入共享 store 并刷新详情状态。</AlertDescription>
      </Alert>
    );
  }

  if (didSave) {
    return (
      <Alert>
        <CheckCircle2Icon />
        <AlertTitle>已保存</AlertTitle>
        <AlertDescription>最近保存时间：{lastSavedAt}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert>
      <Clock3Icon />
      <AlertTitle>最近保存记录</AlertTitle>
      <AlertDescription>最近保存时间：{lastSavedAt}</AlertDescription>
    </Alert>
  );
}
