"use client";

import React from "react";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DialogClose } from "@/components/ui/dialog";

const mood = ["Sad", "Neutral", "Happy", "Excited"] as const;

const formSchema = z.object({
  steps: z.string().min(1, { message: "Steps are required." }),
  sleep: z.string().min(1, { message: "Sleep is required." }),
  mood: z.enum([...mood, ""]),
  water: z.string().optional(),
});

const DashboardForm = () => {
  // shadcn form setup
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      steps: "",
      sleep: "",
      mood: "",
      water: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // await axios.post("/api/ingest", {
      //   steps: Number(values.steps),
      //   sleep: Number(values.sleep),
      //   mood: values.mood,
      //   water: values.water ? Number(values.water) : undefined,
      // });
      console.log("Values:", values);
      toast.success("Health data logged!");
      form.reset();
    } catch (err) {
      toast.error("Failed to log data");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log Health Data</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col space-y-4"
          >
            <FormField
              control={form.control}
              name="steps"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Steps</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g. 10000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sleep"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sleep (hrs)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 7.5"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="mood"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mood</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select mood" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Sad">😞 Sad</SelectItem>
                      <SelectItem value="Neutral">😐 Neutral</SelectItem>
                      <SelectItem value="Happy">😊 Happy</SelectItem>
                      <SelectItem value="Excited">😁 Excited</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="water"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Water (L)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="Optional"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogClose asChild>
              <Button type="submit">Submit</Button>
            </DialogClose>
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
            >
              Clear
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default DashboardForm;
