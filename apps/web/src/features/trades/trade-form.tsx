import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTradeSchema, type CreateTradeInput } from "@edgerift/contracts";
import { Button, Card, CardContent, CardTitle } from "@edgerift/ui";
import { api } from "../../lib/api";

const defaultValues: CreateTradeInput = {
  symbol: "",
  side: "LONG",
  quantity: 1,
  entryPrice: 0,
  openedAt: new Date().toISOString(),
};

export const TradeForm = () => {
  const queryClient = useQueryClient();

  const createTrade = useMutation({
    mutationFn: api.createTrade,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["analytics", "overview"] });
      form.reset();
    },
  });

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      const parsed = createTradeSchema.safeParse(value);
      if (!parsed.success) {
        throw new Error("Validation failed");
      }
      await createTrade.mutateAsync(parsed.data);
    },
  });

  return (
    <Card>
      <CardTitle>Add Trade</CardTitle>
      <CardContent>
        <form
          className="grid gap-3 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            form.handleSubmit();
          }}
        >
          <form.Field
            name="symbol"
            validators={{
              onChange: ({ value }) =>
                value.trim().length === 0 ? "Symbol is required" : undefined,
            }}
          >
            {(field) => (
              <label className="flex flex-col gap-1 text-sm text-zinc-700">
                Symbol
                <input
                  className="rounded-md border border-zinc-300 px-3 py-2"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) =>
                    field.handleChange(event.target.value.toUpperCase())
                  }
                  placeholder="AAPL"
                />
                {field.state.meta.errors.length > 0 ? (
                  <span className="text-xs text-red-600">
                    {field.state.meta.errors[0]}
                  </span>
                ) : null}
              </label>
            )}
          </form.Field>

          <form.Field name="side">
            {(field) => (
              <label className="flex flex-col gap-1 text-sm text-zinc-700">
                Side
                <select
                  className="rounded-md border border-zinc-300 px-3 py-2"
                  value={field.state.value}
                  onChange={(event) =>
                    field.handleChange(event.target.value as "LONG" | "SHORT")
                  }
                >
                  <option value="LONG">LONG</option>
                  <option value="SHORT">SHORT</option>
                </select>
              </label>
            )}
          </form.Field>

          <form.Field name="quantity">
            {(field) => (
              <label className="flex flex-col gap-1 text-sm text-zinc-700">
                Quantity
                <input
                  type="number"
                  min={0}
                  className="rounded-md border border-zinc-300 px-3 py-2"
                  value={field.state.value}
                  onChange={(event) =>
                    field.handleChange(Number(event.target.value))
                  }
                />
              </label>
            )}
          </form.Field>

          <form.Field name="entryPrice">
            {(field) => (
              <label className="flex flex-col gap-1 text-sm text-zinc-700">
                Entry Price
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className="rounded-md border border-zinc-300 px-3 py-2"
                  value={field.state.value}
                  onChange={(event) =>
                    field.handleChange(Number(event.target.value))
                  }
                />
              </label>
            )}
          </form.Field>

          <form.Field name="exitPrice">
            {(field) => (
              <label className="flex flex-col gap-1 text-sm text-zinc-700">
                Exit Price (optional)
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className="rounded-md border border-zinc-300 px-3 py-2"
                  value={field.state.value ?? ""}
                  onChange={(event) => {
                    const raw = event.target.value;
                    field.handleChange(raw.length ? Number(raw) : undefined);
                  }}
                />
              </label>
            )}
          </form.Field>

          <div className="md:col-span-2">
            <Button type="submit" disabled={createTrade.isPending}>
              {createTrade.isPending ? "Saving..." : "Save Trade"}
            </Button>
            {createTrade.error ? (
              <p className="mt-2 text-sm text-red-600">
                {createTrade.error.message}
              </p>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
