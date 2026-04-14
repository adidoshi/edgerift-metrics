import { Layout } from "../components/Layout";
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
  type TradeInput,
} from "../types/trading";
import { format } from "date-fns";
import {
  CalendarIcon,
  CheckCircle2,
  CloudUpload,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
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
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </Label>
      <div className="flex gap-2">
        <Popover>
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
              onSelect={onDateChange}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <Input
          type="time"
          value={time}
          onChange={(e) => onTimeChange(e.target.value)}
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
}: {
  onFileChange: (f: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback(
    (file: File | null) => {
      if (!file) {
        setPreview(null);
        onFileChange(null);
        return;
      }
      const url = URL.createObjectURL(file);
      setPreview(url);
      onFileChange(file);
    },
    [onFileChange],
  );

  return (
    <button
      type="button"
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
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const Journal = () => {
  const createTrade = {
    isPending: false,
    isError: false,
    mutateAsync: async (_input: TradeInput) => undefined,
  };
  const [submitted, setSubmitted] = useState(false);
  const [chartFile, setChartFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
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
      strategy: "",
      model: "",
      tradeIdea: "",
      comments: "",
      session: "",
      pair: "",
    },
  });

  const watchedInstrument = watch("instrument");
  const watchedTags = watch("tags");
  const watchedRules = watch("rulesFollowed");

  const pairOptions = watchedInstrument ? PAIR_OPTIONS[watchedInstrument] : [];

  const toggleTag = (tag: string) => {
    const current = watchedTags ?? [];
    setValue(
      "tags",
      current.includes(tag)
        ? current.filter((t) => t !== tag)
        : [...current, tag],
    );
  };

  const toggleRule = (rule: string, checked: boolean) => {
    const current = watchedRules ?? [];
    setValue(
      "rulesFollowed",
      checked ? [...current, rule] : current.filter((r) => r !== rule),
    );
  };

  const onSubmit = async (data: FormValues) => {
    if (!data.startDate || !data.endDate || !data.instrument || !data.pair)
      return;

    const input: TradeInput = {
      startDateTime: combineDateAndTime(data.startDate, data.startTime),
      endDateTime: combineDateAndTime(data.endDate, data.endTime),
      instrument: data.instrument,
      pair: data.pair,
      direction: data.direction,
      rMultiple: Number(data.rMultiple) || 0,
      grossPnL: Number(data.grossPnL) || 0,
      netPnL: Number(data.netPnL) || 0,
      tags: data.tags,
      session: data.session,
      strategy: data.strategy,
      model: data.model,
      tradeIdea: data.tradeIdea,
      comments: data.comments,
      rulesFollowed: data.rulesFollowed,
      chartImageUrl: chartFile ? chartFile.name : undefined,
    };

    await createTrade.mutateAsync(input);
    setSubmitted(true);
    reset();
    setChartFile(null);
    toast.success("Trade journaled successfully!", {
      description: `${data.direction} ${data.pair} logged to your journal.`,
      duration: 5000,
    });
    setTimeout(() => setSubmitted(false), 3000);
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
                      onTimeChange={(t) => setValue("startTime", t)}
                      error={errors.startDate?.message}
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
                      onTimeChange={(t) => setValue("endTime", t)}
                      error={errors.endDate?.message}
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
                          setValue("pair", "");
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
                    {...register("rMultiple")}
                  />
                </div>
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
                    {...register("grossPnL")}
                  />
                </div>
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
                    {...register("netPnL")}
                  />
                </div>
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
                    {...register("strategy")}
                  />
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
                    {...register("model")}
                  />
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
                    {...register("tradeIdea")}
                  />
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
                    {...register("comments")}
                  />
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
                <ImageUploadZone onFileChange={setChartFile} />
              </div>
            </div>
          </FormSection>

          {/* ── Submit ───────────────────────────────────────────────────── */}
          <div className="pb-8">
            <Button
              type="submit"
              data-ocid="submit-trade"
              disabled={isSubmitting || createTrade.isPending}
              className={`w-full h-12 text-base font-display font-semibold rounded-xl transition-smooth shadow-lg
                ${
                  submitted
                    ? "bg-chart-5/90 hover:bg-chart-5"
                    : "bg-primary hover:bg-primary/90"
                }`}
            >
              {isSubmitting || createTrade.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                  Logging trade…
                </span>
              ) : submitted ? (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Trade Logged!
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
