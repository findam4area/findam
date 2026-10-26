"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Phone, Check } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { requestPhoneOTP, confirmPhoneOTP } from "@/lib/api/verification";
import { parsePhoneNumber, isValidPhoneNumber } from "libphonenumber-js";

const phoneSchema = z.object({
  phone: z
    .string()
    .min(1, "Phone number is required")
    .refine(
      (val) => isValidPhoneNumber(val, "NG"),
      "Invalid Nigerian phone number",
    ),
});

const otpSchema = z.object({
  otp: z
    .string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d+$/, "OTP must contain only numbers"),
});

type PhoneInput = z.infer<typeof phoneSchema>;
type OTPInput = z.infer<typeof otpSchema>;

interface PhoneOTPFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PhoneOTPForm({ onSuccess, onCancel }: PhoneOTPFormProps) {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [isLoading, setIsLoading] = useState(false);
  const [otpId, setOtpId] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");

  const phoneForm = useForm<PhoneInput>({
    resolver: zodResolver(phoneSchema),
  });

  const otpForm = useForm<OTPInput>({
    resolver: zodResolver(otpSchema),
  });

  const onPhoneSubmit = async (data: PhoneInput) => {
    setIsLoading(true);

    try {
      // Format phone number to +234 format
      const parsed = parsePhoneNumber(data.phone, "NG");
      const formattedPhone = parsed.format("E.164");

      const response = await requestPhoneOTP(formattedPhone);

      if (response.success) {
        setPhoneNumber(formattedPhone);
        setOtpId(response.otp_id || "");
        setStep("otp");
        toast.success("OTP sent successfully", {
          description: `Check your phone ${formattedPhone} for the verification code`,
        });
      }
    } catch (error: any) {
      toast.error("Failed to send OTP", {
        description: error.message || "Please try again",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onOTPSubmit = async (data: OTPInput) => {
    setIsLoading(true);

    try {
      const response = await confirmPhoneOTP(phoneNumber, data.otp, otpId);

      if (response.success) {
        toast.success("Phone verified successfully!", {
          description: "Your trust score has been updated",
        });
        onSuccess?.();
      }
    } catch (error: any) {
      toast.error("Invalid OTP", {
        description: error.message || "Please check the code and try again",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);

    try {
      const response = await requestPhoneOTP(phoneNumber);

      if (response.success) {
        setOtpId(response.otp_id || "");
        toast.success("OTP resent successfully");
      }
    } catch (error: any) {
      toast.error("Failed to resend OTP", {
        description: error.message || "Please try again",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {step === "phone" ? (
          <motion.div
            key="phone"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <form
              onSubmit={phoneForm.handleSubmit(onPhoneSubmit)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-white">
                  Phone Number
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+234 XXX XXX XXXX"
                    {...phoneForm.register("phone")}
                    disabled={isLoading}
                    className="pl-10"
                  />
                </div>
                {phoneForm.formState.errors.phone && (
                  <p className="text-sm text-red-500">
                    {phoneForm.formState.errors.phone.message}
                  </p>
                )}
                <p className="text-xs text-gray-400">
                  Enter your Nigerian phone number to receive a verification
                  code
                </p>
              </div>

              <div className="flex gap-3">
                {onCancel && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  type="submit"
                  variant="neon"
                  className="flex-1"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send OTP"
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="otp"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <form
              onSubmit={otpForm.handleSubmit(onOTPSubmit)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-white">
                  Verification Code
                </Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  {...otpForm.register("otp")}
                  disabled={isLoading}
                  className="text-center text-2xl tracking-widest font-mono"
                />
                {otpForm.formState.errors.otp && (
                  <p className="text-sm text-red-500">
                    {otpForm.formState.errors.otp.message}
                  </p>
                )}
                <p className="text-xs text-gray-400">
                  Enter the 6-digit code sent to {phoneNumber}
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep("phone")}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="neon"
                  className="flex-1"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Verify
                    </>
                  )}
                </Button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={isLoading}
                  className="text-sm text-naija-green hover:underline disabled:opacity-50"
                >
                  Didn&apos;t receive the code? Resend
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
