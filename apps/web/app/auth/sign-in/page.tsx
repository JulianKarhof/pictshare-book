"use client";

import { typeboxResolver } from "@hookform/resolvers/typebox";
import { Button } from "@web/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@web/components/ui/card";
import { Checkbox } from "@web/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@web/components/ui/form";
import { Input } from "@web/components/ui/input";
import { signIn } from "@web/lib/auth-client";
import { useOrigin } from "@web/lib/use-origin";
import { cn } from "@web/lib/utils";
import { t } from "elysia/type-system";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const LoginSchema = t.Object({
  email: t.String({
    message: "Please enter a valid email address.",
    format: "email",
    minLength: 5,
    maxLength: 100,
  }),
  password: t.String({
    message: "Password is required.",
    minLength: 8,
    maxLength: 100,
  }),
  rememberMe: t.Boolean({ default: false }),
});

export default function SignIn() {
  const origin = useOrigin();
  const form = useForm<typeof LoginSchema.static>({
    resolver: typeboxResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values: typeof LoginSchema.static) {
    await signIn.email({
      email: values.email,
      password: values.password,
      rememberMe: values.rememberMe,

      callbackURL: origin,
      fetchOptions: {
        onResponse: () => {
          form.reset();
        },
        onError: (ctx) => {
          toast.error(ctx.error.message);
        },
      },
    });
  }

  return (
    <div className="flex flex-col h-screen justify-center items-center">
      <Card className="max-w-md mb-4">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Sign In</CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Password"
                        autoComplete="password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rememberMe"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Checkbox
                        className="mb-0"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel>Remember me</FormLabel>
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  "Login"
                )}
              </Button>

              <div
                className={cn(
                  "w-full gap-2 flex items-center",
                  "justify-between flex-col",
                )}
              >
                <Button
                  type="button"
                  variant="outline"
                  className={cn("w-full gap-2")}
                  onClick={async () => {
                    await signIn.social({
                      provider: "google",
                      callbackURL: origin,
                    });
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="1em"
                    height="1em"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="currentColor"
                      d="M11.99 13.9v-3.72h9.36c.14.63.25 1.22.25 2.05c0 5.71-3.83 9.77-9.6 9.77c-5.52 0-10-4.48-10-10S6.48 2 12 2c2.7 0 4.96.99 6.69 2.61l-2.84 2.76c-.72-.68-1.98-1.48-3.85-1.48c-3.31 0-6.01 2.75-6.01 6.12s2.7 6.12 6.01 6.12c3.83 0 5.24-2.65 5.5-4.22h-5.51z"
                    ></path>
                  </svg>
                  Sign in with Google
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      <p className="text-sm">
        Don't have an account?{" "}
        <Link href="/auth/sign-up" className="underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
