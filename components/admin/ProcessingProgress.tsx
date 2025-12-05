'use client';

import { ProcessingStage } from '@/lib/processor/types';
import { Loader2, CheckCircle2, XCircle, Download, Upload, Link, FileText } from 'lucide-react';

export interface ProcessingProgressProps {
  stage: ProcessingStage;
  progress: number;
  resourceCount?: number;
  totalResources?: number;
}

/**
 * ProcessingProgress Component
 *
 * Displays real-time processing status with:
 * - Current stage indicator
 * - Progress bar
 * - Resource count
 * - Stage-specific icons
 */
export function ProcessingProgress({
  stage,
  progress,
  resourceCount = 0,
  totalResources = 0,
}: ProcessingProgressProps) {
  // Stage configurations
  const stageConfig: Record<
    ProcessingStage,
    {
      label: string;
      icon: React.ReactNode;
      color: string;
      bgColor: string;
      textColor: string;
    }
  > = {
    [ProcessingStage.IDLE]: {
      label: 'Ready to Process',
      icon: <FileText className="w-5 h-5" />,
      color: 'bg-gray-600',
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-700',
    },
    [ProcessingStage.PARSING]: {
      label: 'Parsing HTML',
      icon: <FileText className="w-5 h-5" />,
      color: 'bg-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
    },
    [ProcessingStage.DOWNLOADING]: {
      label: 'Downloading Resources',
      icon: <Download className="w-5 h-5" />,
      color: 'bg-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
    },
    [ProcessingStage.UPLOADING]: {
      label: 'Uploading to CMS',
      icon: <Upload className="w-5 h-5" />,
      color: 'bg-indigo-600',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-700',
    },
    [ProcessingStage.REPLACING]: {
      label: 'Replacing URLs',
      icon: <Link className="w-5 h-5" />,
      color: 'bg-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
    },
    [ProcessingStage.COMPLETE]: {
      label: 'Complete',
      icon: <CheckCircle2 className="w-5 h-5" />,
      color: 'bg-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
    },
    [ProcessingStage.FAILED]: {
      label: 'Failed',
      icon: <XCircle className="w-5 h-5" />,
      color: 'bg-red-600',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
    },
  };

  const config = stageConfig[stage];
  const isProcessing =
    stage !== ProcessingStage.IDLE &&
    stage !== ProcessingStage.COMPLETE &&
    stage !== ProcessingStage.FAILED;

  return (
    <div className={`rounded-lg border-2 ${config.bgColor} p-6`}>
      {/* Stage Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`${config.color} text-white p-2 rounded-lg`}>
            {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : config.icon}
          </div>
          <div>
            <h3 className={`text-lg font-semibold ${config.textColor}`}>{config.label}</h3>
            {totalResources > 0 && (
              <p className="text-sm text-gray-600">
                {resourceCount} of {totalResources} resources
              </p>
            )}
          </div>
        </div>
        <div className={`text-2xl font-bold ${config.textColor}`}>{Math.round(progress)}%</div>
      </div>

      {/* Progress Bar */}
      <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 ${config.color} transition-all duration-300 ease-out`}
          style={{ width: `${progress}%` }}
        >
          {isProcessing && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          )}
        </div>
      </div>

      {/* Stage Progress Steps */}
      <div className="mt-4 flex justify-between items-center text-xs">
        {[
          { stage: ProcessingStage.PARSING, label: 'Parse' },
          { stage: ProcessingStage.DOWNLOADING, label: 'Download' },
          { stage: ProcessingStage.UPLOADING, label: 'Upload' },
          { stage: ProcessingStage.REPLACING, label: 'Replace' },
        ].map((step, index) => {
          const isCurrentStage = step.stage === stage;
          const isPastStage =
            Object.values(ProcessingStage).indexOf(stage) >
            Object.values(ProcessingStage).indexOf(step.stage);
          const isCompleteStage = stage === ProcessingStage.COMPLETE;

          return (
            <div key={step.stage} className={`flex items-center ${index !== 3 ? 'flex-1' : ''}`}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold transition-colors ${
                    isPastStage || isCompleteStage
                      ? 'bg-green-600 text-white'
                      : isCurrentStage
                        ? `${config.color} text-white`
                        : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {isPastStage || isCompleteStage ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={`mt-1 font-medium ${
                    isCurrentStage ? config.textColor : 'text-gray-600'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index !== 3 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    isPastStage || isCompleteStage ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
