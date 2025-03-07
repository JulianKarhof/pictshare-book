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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@web/components/ui/form";
import { Input } from "@web/components/ui/input";
import { signUp } from "@web/lib/auth-client";
import { t } from "elysia/type-system";
import { Loader2, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const SignUpSchema = t.Object({
  firstName: t.String({ minLength: 1, message: "First name is required" }),
  lastName: t.String({ minLength: 1, message: "Last name is required" }),
  email: t.String({
    format: "email",
    message: "Please enter a valid email address",
  }),
  password: t.String({
    minLength: 8,
    message: "Password must be at least 8 characters",
  }),
  passwordConfirmation: t.String(),
  image: t.Optional(t.Any()),
});

export default function SignUp() {
  const router = useRouter();
  const form = useForm<typeof SignUpSchema.static>({
    resolver: typeboxResolver(SignUpSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      passwordConfirmation: "",
    },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values: typeof SignUpSchema.static) {
    if (values.password !== values.passwordConfirmation) {
      toast.error("Passwords do not match");
      return;
    }

    await signUp.email({
      email: values.email,
      password: values.password,
      name: `${values.firstName} ${values.lastName}`,
      image: values.image
        ? await convertImageToBase64(values.image as File)
        : "",

      callbackURL: "/",
      fetchOptions: {
        onResponse: () => {
          form.reset();
        },
        onError: (ctx) => {
          toast.error(ctx.error.message);
        },
        onSuccess: () => {
          toast.success("Account created successfully");
          router.push("/");
        },
      },
    });
  }

  return (
    <div className="flex flex-col h-screen justify-center items-center">
      <Card className="z-50 rounded-md max-w-md mb-4">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Sign Up</CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Enter your information to create an account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First name</FormLabel>
                      <FormControl>
                        <Input placeholder="Max" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last name</FormLabel>
                      <FormControl>
                        <Input placeholder="Mustermann" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="max@example.com"
                        {...field}
                      />
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
                        autoComplete="new-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="passwordConfirmation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Confirm Password"
                        autoComplete="new-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="image"
                render={({ field: { value, onChange, ...field } }) => (
                  <FormItem>
                    <FormLabel>Profile Image (optional)</FormLabel>
                    <div className="flex items-end gap-4">
                      {value && (
                        <div className="relative w-16 h-16 rounded-sm overflow-hidden">
                          <Image
                            src={URL.createObjectURL(value as File)}
                            alt="Profile preview"
                            layout="fill"
                            objectFit="cover"
                          />
                        </div>
                      )}
                      <div className="flex items-center gap-2 w-full">
                        <FormControl>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                onChange(file);
                              }
                            }}
                            className="w-full py-1.5"
                            {...field}
                          />
                        </FormControl>
                        {value && (
                          <X
                            className="cursor-pointer"
                            onClick={() => onChange(null)}
                          />
                        )}
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  "Create an account"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      <p className="text-sm">
        Already have an account?{" "}
        <Link href="/auth/sign-in" className="underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

async function convertImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
