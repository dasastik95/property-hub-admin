import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { MessageCircle, Send } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const inquirySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  whatsapp: z.string().optional(),
  inquiryType: z.enum(["general", "price", "availability", "visit", "documents"]),
  message: z.string().min(10, "Please provide more details about your inquiry"),
});

type InquiryFormData = z.infer<typeof inquirySchema>;

interface PropertyInquiryFormProps {
  propertyId: string;
  propertyTitle: string;
  trigger?: React.ReactNode;
}

export function PropertyInquiryForm({ propertyId, propertyTitle, trigger }: PropertyInquiryFormProps) {
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<InquiryFormData>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      name: profile?.display_name || "",
      email: profile?.email || "",
      phone: profile?.phone || "",
      whatsapp: profile?.whatsapp || "",
      inquiryType: "general",
      message: `Hi! I'm interested in "${propertyTitle}". Please provide more details.`,
    },
  });

  const onSubmit = async (data: InquiryFormData) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("property_inquiries")
        .insert({
          property_id: propertyId,
          user_id: user?.id || null,
          name: data.name,
          email: data.email,
          phone: data.phone,
          whatsapp: data.whatsapp || null,
          inquiry_type: data.inquiryType,
          message: data.message,
          status: "pending",
        });

      if (error) {
        console.error("Database error:", error);
        // Check if it's a table not found error
        if (error.code === '42P01') {
          toast.error("Inquiry system is being set up. Please try again later or contact the owner directly.");
          return;
        }
        throw error;
      }

      toast.success("Inquiry sent successfully! The property owner will contact you soon.");
      setOpen(false);
      form.reset();
    } catch (error: any) {
      console.error("Failed to send inquiry:", error);
      toast.error("Failed to send inquiry. Please try again or contact the owner directly.");
    } finally {
      setLoading(false);
    }
  };

  const defaultTrigger = (
    <Button className="w-full bg-success text-success-foreground hover:bg-success/90">
      <MessageCircle className="h-4 w-4 mr-2" />
      Send Inquiry
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Inquire about this property</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Send a detailed inquiry to the property owner. They'll get back to you soon!
          </p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Your full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="your@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="+91 9876543210" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="whatsapp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="+91 9876543210" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="inquiryType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Inquiry Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select inquiry type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="general">General Inquiry</SelectItem>
                      <SelectItem value="price">Price Discussion</SelectItem>
                      <SelectItem value="availability">Availability Check</SelectItem>
                      <SelectItem value="visit">Schedule Visit</SelectItem>
                      <SelectItem value="documents">Property Documents</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell the owner about your requirements, preferred timeline, etc."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  "Sending..."
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Inquiry
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}