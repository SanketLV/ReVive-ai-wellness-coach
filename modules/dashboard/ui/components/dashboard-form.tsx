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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";

const mood = ["Sad", "Neutral", "Happy", "Excited"] as const;

const formSchema = z.object({
  date: z.date({ message: "Date is required." }),
  steps: z.string().min(1, { message: "Steps are required." }),
  sleep: z.string().min(1, { message: "Sleep is required." }),
  mood: z.enum([...mood, ""]),
  water: z.string().optional(),
});

const DashboardForm = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      steps: "",
      sleep: "",
      mood: "",
      water: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const payload = {
      ...values,
      timestamp: values.date.getTime(),
    };
    console.log("Submitting:", payload);
    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Health data logged!");
      } else {
        toast.error(data.error || "Failed to send the health data.");
      }
    } catch (err) {
      toast.error("Failed to log data");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Health Data</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col space-y-4"
          >
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant="outline" className="">
                          {field.name ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a Date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date()}
                        captionLayout="dropdown"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
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
