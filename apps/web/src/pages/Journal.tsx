import { Layout } from "../components/Layout";
import { api, isApiError } from "../lib/api";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Calendar } from "../components/ui/calendar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Separator } from "../components/ui/separator";
import { Textarea } from "../components/ui/textarea";
import {
  Direction,
  Instrument,
  PAIR_OPTIONS,
  RULES_OPTIONS,
  SESSION_OPTIONS,
  TAG_OPTIONS,
} from "../types/trading";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  CalendarIcon,
  CheckCircle2,
  CloudUpload,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormValues {
  startDate: Date | undefined;
  startTime: string;
  endDate: Date | undefined;
  endTime: string;
  instrument: Instrument | undefined;
  pair: string;
  direction: Direction;
  rMultiple: string;
  grossPnL: string;
  netPnL: string;
  commissions: string;
  swapCharges: string;
  tags: string[];
  session: string;
  strategy: string;
  model: string;
  tradeIdea: string;
  comments: string;
  rulesFollowed: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function combineDateAndTime(date: Date, time: string): bigint {
  const [hours, minutes] = time.split(":").map(Number);
  const combined = new Date(date);
  combined.setHours(hours, minutes, 0, 0);
  return BigInt(combined.getTime()) * 1_000_000n;
}

function calculateNetPnl(
  grossPnL: string,
  commissions: string,
  swapCharges: string,
): string {
  const trimmedGrossPnL = grossPnL.trim();
  if (!trimmedGrossPnL) {
    return "";
  }

  const grossValue = Number(trimmedGrossPnL);
  if (Number.isNaN(grossValue)) {
    return "";
  }

  const commissionsValue = commissions.trim()
    ? Math.abs(Number(commissions))
    : 0;
  const swapChargesValue = swapCharges.trim() ? Number(swapCharges) : 0;

  const netValue =
    grossValue -
    (Number.isNaN(commissionsValue) ? 0 : commissionsValue) +
    (Number.isNaN(swapChargesValue) ? 0 : swapChargesValue);

  return netValue.toFixed(2);
}

// ─── Section Wrapper ──────────────────────────────────────────────────────────

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="bg-card/60 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-display font-semibold text-foreground flex items-center gap-2">
          <span className="w-1.5 h-5 rounded-full bg-primary/80 inline-block" />
          {title}
        </CardTitle>
        <Separator className="bg-border/40" />
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

// ─── Date/Time Picker ─────────────────────────────────────────────────────────

function DateTimePicker({
  label,
  date,
  time,
  onDateChange,
  onTimeChange,
  error,
  dataOcid,
}: {
  label: string;
  date: Date | undefined;
  time: string;
  onDateChange: (d: Date | undefined) => void;
  onTimeChange: (t: string) => void;
  error?: string;
  dataOcid: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </Label>
      <div className="flex gap-2">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              data-ocid={dataOcid}
              className="flex-1 justify-start text-left font-normal bg-background/50 border-input hover:border-primary/50 hover:bg-muted/30 transition-smooth"
            >
              <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
              {date ? (
                format(date, "MMM dd, yyyy")
              ) : (
                <span className="text-muted-foreground">Pick date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-0 bg-popover border-border"
            align="start"
          >
            <Calendar
              mode="single"
              selected={date}
              onSelect={(selectedDate) => {
                onDateChange(selectedDate);
                if (selectedDate) {
                  setIsOpen(false);
                }
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <Input
          type="time"
          value={time}
          onChange={(e) => {
            const newTime = e.target.value;
            onTimeChange(newTime);
            setTimeout(() => {
              if (newTime) e.target.blur();
            }, 1000);
          }}
          className="w-36 bg-background/50 border-input hover:border-primary/50 transition-smooth font-mono text-sm"
          data-ocid={`${dataOcid}-time`}
        />
      </div>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}

// ─── Image Upload Zone ────────────────────────────────────────────────────────

function ImageUploadZone({
  onFileChange,
  resetToken,
}: {
  onFileChange: (f: File | null) => void;
  resetToken: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (preview) {
      return () => {
        URL.revokeObjectURL(preview);
      };
    }
  }, [preview]);

  useEffect(() => {
    setPreview(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, [resetToken]);

  const handleFile = useCallback(
    (file: File | null) => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }

      if (!file) {
        setPreview(null);
        onFileChange(null);
        return;
      }
      const url = URL.createObjectURL(file);
      setPreview(url);
      onFileChange(file);
    },
    [onFileChange, preview],
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file?.type.startsWith("image/")) handleFile(file);
      }}
      className={`relative w-full rounded-xl border-2 border-dashed transition-smooth cursor-pointer group overflow-hidden text-left
        ${dragging ? "border-primary bg-primary/10" : "border-border/50 bg-background/30 hover:border-primary/50 hover:bg-muted/20"}`}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      data-ocid="image-upload-zone"
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />
      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Chart preview"
            className="w-full max-h-64 object-contain rounded-lg"
          />
          <button
            type="button"
            aria-label="Remove chart image"
            onClick={(e) => {
              e.stopPropagation();
              handleFile(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="absolute top-2 right-2 rounded-full bg-destructive/90 p-1 text-destructive-foreground hover:bg-destructive transition-smooth"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <div className="p-3 rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-smooth">
            <CloudUpload className="h-7 w-7" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">
              Upload Chart Screenshot
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Drag & drop or click to browse · PNG, JPG, WebP
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const Journal = () => {
  const queryClient = useQueryClient();
  const [chartFile, setChartFile] = useState<File | null>(null);
  const [imageResetToken, setImageResetToken] = useState(0);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      tags: [],
      rulesFollowed: [],
      startTime: "09:00",
      endTime: "10:00",
      direction: Direction.Buy,
      rMultiple: "",
      grossPnL: "",
      netPnL: "",
      commissions: "",
      swapCharges: "",
      strategy: "",
      model: "",
      tradeIdea: "",
      comments: "",
      session: "",
      pair: "",
    },
  });

  useEffect(() => {
    register("startTime", { required: "Entry time required" });
    register("endTime", { required: "Exit time required" });
    register("tags", {
      validate: (value) => value.length > 0 || "Select at least one tag.",
    });
    register("rulesFollowed");
  }, [register]);

  const createTrade = useMutation({
    mutationFn: api.createTrade,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["analytics", "overview"] }),
        queryClient.invalidateQueries({ queryKey: ["trades"] }),
      ]);
    },
  });

  const isUploadingTrade = isSubmitting || createTrade.isPending;

  const watchedInstrument = watch("instrument");
  const watchedTags = watch("tags");
  const watchedRules = watch("rulesFollowed");
  const watchedGrossPnL = watch("grossPnL");
  const watchedCommissions = watch("commissions");
  const watchedSwapCharges = watch("swapCharges");
  const calculatedNetPnL = calculateNetPnl(
    watchedGrossPnL,
    watchedCommissions,
    watchedSwapCharges,
  );

  useEffect(() => {
    setValue("netPnL", calculatedNetPnL, {
      shouldDirty: false,
      shouldValidate: false,
    });
  }, [calculatedNetPnL, setValue]);

  const pairOptions = watchedInstrument ? PAIR_OPTIONS[watchedInstrument] : [];

  const fillTestData = () => {
    const sampleTradeDate = new Date();

    reset({
      startDate: sampleTradeDate,
      startTime: "09:00",
      endDate: sampleTradeDate,
      endTime: "10:15",
      instrument: Instrument.Commodity,
      pair: "XAUUSD",
      direction: Direction.Buy,
      rMultiple: "-1.33",
      grossPnL: "-1325.00",
      netPnL: "1332.5",
      commissions: "7.50",
      swapCharges: "0.00",
      tags: ["A+ Setup", "London Session"],
      session: "London",
      strategy: "Liquidity Sweep Reversal",
      model: "Morning Range Expansion",
      tradeIdea:
        "Price swept Asian session liquidity, reclaimed the range low, and aligned with bullish higher-timeframe structure.",
      comments:
        "Execution stayed within plan. Entry was patient, risk was defined, and partials were scaled out at target levels.",
      rulesFollowed: [
        "Waited for confirmation",
        "Respected stop loss",
        "Followed trading plan",
      ],
    });
    setChartFile(null);
    setImageResetToken((current) => current + 1);
    clearErrors();
  };

  const toggleTag = (tag: string) => {
    const current = watchedTags ?? [];
    setValue(
      "tags",
      current.includes(tag)
        ? current.filter((t) => t !== tag)
        : [...current, tag],
      { shouldDirty: true, shouldValidate: true },
    );
    clearErrors("tags");
  };

  const toggleRule = (rule: string, checked: boolean) => {
    const current = watchedRules ?? [];
    setValue(
      "rulesFollowed",
      checked ? [...current, rule] : current.filter((r) => r !== rule),
      { shouldDirty: true },
    );
  };

  const onSubmit = async (data: FormValues) => {
    if (!data.startDate || !data.endDate || !data.instrument || !data.pair) {
      return;
    }

    const formData = new FormData();
    formData.append(
      "startDateTime",
      combineDateAndTime(data.startDate, data.startTime).toString(),
    );
    formData.append(
      "endDateTime",
      combineDateAndTime(data.endDate, data.endTime).toString(),
    );
    formData.append("instrument", data.instrument);
    formData.append("pair", data.pair);
    formData.append("direction", data.direction);
    formData.append("rMultiple", data.rMultiple);
    formData.append("grossPnL", data.grossPnL);
    formData.append("netPnL", calculatedNetPnL);
    formData.append("commissions", data.commissions);
    formData.append("swapCharges", data.swapCharges.trim() || "0");
    formData.append("session", data.session);
    formData.append("strategy", data.strategy);
    formData.append("model", data.model);
    formData.append("tradeIdea", data.tradeIdea);
    formData.append("comments", data.comments);
    formData.append("tags", JSON.stringify(data.tags));
    formData.append("rulesFollowed", JSON.stringify(data.rulesFollowed));

    if (chartFile) {
      formData.append("image", chartFile);
    }

    try {
      await createTrade.mutateAsync(formData);
      reset();
      setChartFile(null);
      setImageResetToken((current) => current + 1);
      toast.success(
        chartFile
          ? "Image uploaded and trade saved!"
          : "Trade journaled successfully!",
        {
          description: `${data.direction} ${data.pair} logged to your journal.`,
        },
      );
    } catch (error) {
      toast.error(
        isApiError(error)
          ? (error.payload.message ?? "Failed to save trade.")
          : error instanceof Error
            ? error.message
            : "Failed to save trade.",
      );
    }
  };

  return (
    <Layout>
      <div className="min-h-full bg-gradient-to-b from-background via-background to-muted/20">
        {/* Page Header */}
        <div className="sticky top-0 z-10 bg-card/80 backdrop-blur-md border-b border-border/50 px-6 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-xl font-display font-bold text-foreground">
                Trade Journal
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Log your trades with precision — every detail counts
              </p>
            </div>
            <Badge
              variant="outline"
              className="text-xs border-primary/30 text-primary bg-primary/5"
            >
              New Entry
            </Badge>
          </div>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-5"
        >
          {/* ── Section 1: Trade Details ─────────────────────────────────── */}
          <FormSection title="Trade Details">
            <div className="space-y-5">
              {/* Date/Time Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Controller
                  control={control}
                  name="startDate"
                  rules={{ required: "Entry date required" }}
                  render={({ field }) => (
                    <DateTimePicker
                      label="Entry Date & Time"
                      date={field.value}
                      time={watch("startTime")}
                      onDateChange={field.onChange}
                      onTimeChange={(t) =>
                        setValue("startTime", t, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                      error={
                        errors.startDate?.message ?? errors.startTime?.message
                      }
                      dataOcid="start-datetime"
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="endDate"
                  rules={{ required: "Exit date required" }}
                  render={({ field }) => (
                    <DateTimePicker
                      label="Exit Date & Time"
                      date={field.value}
                      time={watch("endTime")}
                      onDateChange={field.onChange}
                      onTimeChange={(t) =>
                        setValue("endTime", t, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                      error={errors.endDate?.message ?? errors.endTime?.message}
                      dataOcid="end-datetime"
                    />
                  )}
                />
              </div>

              {/* Instrument + Pair */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Instrument
                  </Label>
                  <Controller
                    control={control}
                    name="instrument"
                    rules={{ required: "Instrument required" }}
                    render={({ field }) => (
                      <Select
                        value={field.value ?? ""}
                        onValueChange={(v) => {
                          field.onChange(v as Instrument);
                          setValue("pair", "", {
                            shouldDirty: true,
                            shouldValidate: false,
                          });
                          clearErrors("pair");
                        }}
                      >
                        <SelectTrigger
                          data-ocid="instrument-select"
                          className="bg-background/50 border-input hover:border-primary/50 transition-smooth"
                        >
                          <SelectValue placeholder="Select instrument…" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          <SelectItem value={Instrument.Forex}>
                            Forex
                          </SelectItem>
                          <SelectItem value={Instrument.Commodity}>
                            Commodities
                          </SelectItem>
                          <SelectItem value={Instrument.Index}>
                            Indices
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.instrument && (
                    <p className="text-xs text-destructive">
                      {errors.instrument.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Pair
                  </Label>
                  <Controller
                    control={control}
                    name="pair"
                    rules={{ required: "Pair required" }}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={!watchedInstrument}
                      >
                        <SelectTrigger
                          data-ocid="pair-select"
                          className="bg-background/50 border-input hover:border-primary/50 transition-smooth disabled:opacity-40"
                        >
                          <SelectValue
                            placeholder={
                              watchedInstrument
                                ? "Select pair…"
                                : "Choose instrument first"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          {pairOptions.map((p) => (
                            <SelectItem key={p} value={p}>
                              {p}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.pair && (
                    <p className="text-xs text-destructive">
                      {errors.pair.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Direction */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Direction
                </Label>
                <Controller
                  control={control}
                  name="direction"
                  render={({ field }) => (
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="flex gap-3"
                    >
                      <label
                        htmlFor="dir-buy"
                        data-ocid="direction-buy"
                        className={`flex-1 flex items-center gap-3 rounded-lg border-2 px-4 py-3 cursor-pointer transition-smooth
                          ${
                            field.value === Direction.Buy
                              ? "border-chart-5 bg-chart-5/10 text-chart-5"
                              : "border-border/50 bg-background/30 text-muted-foreground hover:border-chart-5/40"
                          }`}
                      >
                        <RadioGroupItem
                          value={Direction.Buy}
                          id="dir-buy"
                          className="sr-only"
                        />
                        <TrendingUp className="h-5 w-5 flex-shrink-0" />
                        <div>
                          <p className="font-display font-semibold text-sm">
                            Buy / Long
                          </p>
                          <p className="text-xs opacity-70">Bullish position</p>
                        </div>
                      </label>
                      <label
                        htmlFor="dir-sell"
                        data-ocid="direction-sell"
                        className={`flex-1 flex items-center gap-3 rounded-lg border-2 px-4 py-3 cursor-pointer transition-smooth
                          ${
                            field.value === Direction.Sell
                              ? "border-destructive bg-destructive/10 text-destructive"
                              : "border-border/50 bg-background/30 text-muted-foreground hover:border-destructive/40"
                          }`}
                      >
                        <RadioGroupItem
                          value={Direction.Sell}
                          id="dir-sell"
                          className="sr-only"
                        />
                        <TrendingDown className="h-5 w-5 flex-shrink-0" />
                        <div>
                          <p className="font-display font-semibold text-sm">
                            Sell / Short
                          </p>
                          <p className="text-xs opacity-70">Bearish position</p>
                        </div>
                      </label>
                    </RadioGroup>
                  )}
                />
              </div>
            </div>
          </FormSection>

          {/* ── Section 2: Performance ───────────────────────────────────── */}
          <FormSection title="Performance">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="rMultiple"
                  className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  R Multiple
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground pointer-events-none">
                    R
                  </span>
                  <Input
                    id="rMultiple"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    data-ocid="r-multiple-input"
                    className="pl-7 bg-background/50 border-input font-mono hover:border-primary/50 transition-smooth"
                    {...register("rMultiple", {
                      required: "R multiple is required.",
                    })}
                  />
                </div>
                {errors.rMultiple && (
                  <p className="text-xs text-destructive">
                    {errors.rMultiple.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="grossPnL"
                  className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  Gross PnL
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground pointer-events-none">
                    $
                  </span>
                  <Input
                    id="grossPnL"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    data-ocid="gross-pnl-input"
                    className="pl-7 bg-background/50 border-input font-mono hover:border-primary/50 transition-smooth"
                    {...register("grossPnL", {
                      required: "Gross PnL is required.",
                    })}
                  />
                </div>
                {errors.grossPnL && (
                  <p className="text-xs text-destructive">
                    {errors.grossPnL.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="netPnL"
                  className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  Net PnL
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground pointer-events-none">
                    $
                  </span>
                  <Input
                    id="netPnL"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    data-ocid="net-pnl-input"
                    className="pl-7 bg-background/50 border-input font-mono hover:border-primary/50 transition-smooth"
                    value={calculatedNetPnL}
                    readOnly
                    disabled
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="commissions"
                  className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  Commissions
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground pointer-events-none">
                    $
                  </span>
                  <Input
                    id="commissions"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    data-ocid="commissions-input"
                    className="pl-7 bg-background/50 border-input font-mono hover:border-primary/50 transition-smooth"
                    {...register("commissions", {
                      required: "Commissions are required.",
                    })}
                  />
                </div>
                {errors.commissions && (
                  <p className="text-xs text-destructive">
                    {errors.commissions.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="swapCharges"
                  className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  Swap Charges
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground pointer-events-none">
                    $
                  </span>
                  <Input
                    id="swapCharges"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    data-ocid="swap-charges-input"
                    className="pl-7 bg-background/50 border-input font-mono hover:border-primary/50 transition-smooth"
                    {...register("swapCharges")}
                  />
                </div>
                {errors.swapCharges && (
                  <p className="text-xs text-destructive">
                    {errors.swapCharges.message}
                  </p>
                )}
              </div>
            </div>
          </FormSection>

          {/* ── Section 3: Analysis ──────────────────────────────────────── */}
          <FormSection title="Analysis">
            <div className="space-y-5">
              {/* Session + Strategy + Model */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Session
                  </Label>
                  <Controller
                    control={control}
                    name="session"
                    rules={{ required: "Session is required." }}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger
                          data-ocid="session-select"
                          className="bg-background/50 border-input hover:border-primary/50 transition-smooth"
                        >
                          <SelectValue placeholder="Select session…" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          {SESSION_OPTIONS.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.session && (
                    <p className="text-xs text-destructive">
                      {errors.session.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="strategy"
                    className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
                  >
                    Strategy Used
                  </Label>
                  <Input
                    id="strategy"
                    placeholder="e.g. ICT Liquidity Sweep"
                    data-ocid="strategy-input"
                    className="bg-background/50 border-input hover:border-primary/50 transition-smooth"
                    {...register("strategy", {
                      required: "Strategy is required.",
                    })}
                  />
                  {errors.strategy && (
                    <p className="text-xs text-destructive">
                      {errors.strategy.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="model"
                    className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
                  >
                    Model Followed
                  </Label>
                  <Input
                    id="model"
                    placeholder="e.g. Silver Bullet"
                    data-ocid="model-input"
                    className="bg-background/50 border-input hover:border-primary/50 transition-smooth"
                    {...register("model", {
                      required: "Trading model is required.",
                    })}
                  />
                  {errors.model && (
                    <p className="text-xs text-destructive">
                      {errors.model.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Tags
                </Label>
                <div className="flex flex-wrap gap-2">
                  {TAG_OPTIONS.map((tag) => {
                    const active = watchedTags?.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        data-ocid={`tag-${tag.toLowerCase().replace(/\s+/g, "-")}`}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-smooth
                          ${
                            active
                              ? "bg-primary/20 border-primary text-primary"
                              : "bg-background/30 border-border/50 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                          }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
                {errors.tags && (
                  <p className="text-xs text-destructive">
                    {errors.tags.message}
                  </p>
                )}
              </div>

              {/* Trade Idea + Comments */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="tradeIdea"
                    className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
                  >
                    Trade Idea
                  </Label>
                  <Textarea
                    id="tradeIdea"
                    placeholder="What was your rationale for this trade?"
                    rows={3}
                    data-ocid="trade-idea-input"
                    className="bg-background/50 border-input resize-none hover:border-primary/50 transition-smooth"
                    {...register("tradeIdea", {
                      required: "Trade idea is required.",
                    })}
                  />
                  {errors.tradeIdea && (
                    <p className="text-xs text-destructive">
                      {errors.tradeIdea.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="comments"
                    className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
                  >
                    Comments
                  </Label>
                  <Textarea
                    id="comments"
                    placeholder="Post-trade reflections, lessons, emotions…"
                    rows={3}
                    data-ocid="comments-input"
                    className="bg-background/50 border-input resize-none hover:border-primary/50 transition-smooth"
                    {...register("comments", {
                      required: "Comments are required.",
                    })}
                  />
                  {errors.comments && (
                    <p className="text-xs text-destructive">
                      {errors.comments.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </FormSection>

          {/* ── Section 4: Documentation ─────────────────────────────────── */}
          <FormSection title="Documentation">
            <div className="space-y-6">
              {/* Rules Followed */}
              <div className="space-y-3">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Rules Followed
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {RULES_OPTIONS.map((rule) => {
                    const checked = watchedRules?.includes(rule) ?? false;
                    const ruleId = `rule-cb-${rule.toLowerCase().replace(/\s+/g, "-")}`;
                    return (
                      <label
                        key={rule}
                        htmlFor={ruleId}
                        data-ocid={`rule-${rule.toLowerCase().replace(/\s+/g, "-")}`}
                        className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-smooth
                          ${
                            checked
                              ? "border-chart-5/50 bg-chart-5/8 text-foreground"
                              : "border-border/40 bg-background/20 text-muted-foreground hover:border-border hover:text-foreground"
                          }`}
                      >
                        <Checkbox
                          id={ruleId}
                          checked={checked}
                          onCheckedChange={(v) => toggleRule(rule, !!v)}
                          className="data-[state=checked]:bg-chart-5 data-[state=checked]:border-chart-5"
                        />
                        <span className="text-sm">{rule}</span>
                        {checked && (
                          <CheckCircle2 className="h-4 w-4 text-chart-5 ml-auto flex-shrink-0" />
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Chart Image Upload */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Chart Screenshot
                </Label>
                <ImageUploadZone
                  onFileChange={setChartFile}
                  resetToken={imageResetToken}
                />
              </div>
            </div>
          </FormSection>

          {/* ── Submit ───────────────────────────────────────────────────── */}
          <div className="pb-8">
            <Button
              type="button"
              variant="outline"
              data-ocid="fill-test-data"
              onClick={fillTestData}
              disabled={isUploadingTrade}
              className="mb-3 w-full h-12 text-base font-display font-semibold rounded-xl border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary cursor-pointer"
            >
              Fill test data automatically
            </Button>
            <Button
              type="submit"
              data-ocid="submit-trade"
              disabled={isUploadingTrade}
              className="w-full h-12 text-base font-display font-semibold rounded-xl transition-smooth shadow-lg bg-primary hover:bg-primary/90 cursor-pointer"
            >
              {isUploadingTrade ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                  Uploading image and saving trade...
                </span>
              ) : (
                "Log Trade to Journal"
              )}
            </Button>
            {createTrade.isError && (
              <p className="text-center text-xs text-destructive mt-2">
                Failed to save trade. Please try again.
              </p>
            )}
          </div>
        </form>
      </div>
    </Layout>
  );
};
