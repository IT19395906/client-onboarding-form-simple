'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState } from 'react';

const Form = z.object({
    fullName: z.string().min(2, 'must be at least 2 characters').max(80, 'must be under 80 characters').regex(/^[a-zA-Z\s'-]+$/),
    email: z.string().email('Invalid email address'),
    companyName: z.string().min(2, 'must be at least 2 characters').max(100, 'must be under 100 characters'),
    services: z.array(z.enum(['UI/UX', 'Branding', 'Web Dev', 'Mobile App'])).min(1, 'Select at least one service'),
    budget: z.number()
        .optional()
        .refine(value => value === undefined || (value >= 100 && value <= 1_000_000), {
            message: 'must be between 100 and 1000000',
        }),
    startDate: z.string().refine(value => {
        const today = new Date();
        const inputDate = new Date(value);
        return inputDate >= new Date(today.toDateString());
    }, { message: 'must be today or later', }),
    terms: z.boolean().refine(value => value === true, { message: 'must accept the terms' }),
});

type FormData = z.infer<typeof Form>;

export default function OnboardingForm() {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset } = useForm<FormData>({
            resolver: zodResolver(Form),
            defaultValues: { services: [], terms: false },
        });

    const [submitSuccess, setSubmitSuccess] = useState<null | FormData>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const onSubmit = async (data: FormData) => {
        setSubmitSuccess(null);
        setSubmitError(null);

        try {
            const response = await fetch(process.env.NEXT_PUBLIC_ONBOARD_URL!, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Submit failed');
            }

            setSubmitSuccess(data);
            reset();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            setSubmitError(error.message || 'Server error');
        }
    };

    return (
        <main className="max-w-xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-4 text-center">Client Onboarding</h1>
            {submitError && (
                <div className="bg-red-100 text-red-700 p-3 mb-4 rounded">Error: {submitError}</div>
            )}
            {submitSuccess && (
                <div className="bg-green-100 text-green-700 p-3 mb-4 rounded">
                    <b>Success!</b>
                    <pre className="mt-2 text-sm bg-white p-2 rounded">
                        {JSON.stringify(submitSuccess, null, 2)}
                    </pre>
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <label className="block mb-1 font-medium">Full Name</label>
                <input className="w-full p-2 border rounded" type='text' {...register('fullName')} />
                {errors.fullName && <p className="text-sm text-red-400">{errors.fullName.message}</p>}

                <label className="block mt-4 mb-1 font-medium">Email</label>
                <input className="w-full p-2 border rounded" type="email" {...register('email')} />
                {errors.email && <p className="text-sm text-red-400">{errors.email.message}</p>}

                <label className="block mt-4 mb-1 font-medium">Company Name</label>
                <input className="w-full p-2 border rounded" type="text" {...register('companyName')} />
                {errors.companyName && <p className="text-sm text-red-400">{errors.companyName.message}</p>}

                <fieldset className="mt-4">
                    <legend className="font-medium mb-1">Services</legend>
                    {['UI/UX', 'Branding', 'Web Dev', 'Mobile App'].map(service => (
                        <label key={service} className="block">
                            <input className="mr-2" type="checkbox" value={service} {...register('services')} />
                            {service}
                        </label>
                    ))}
                    {errors.services && <p className="text-sm text-red-400">{errors.services.message}</p>}
                </fieldset>

                <label className="block mt-4 mb-1 font-medium">Budget</label>
                <input className="w-full p-2 border rounded" type="number" {...register('budget', { valueAsNumber: true })} />
                {errors.budget && <p className="text-sm text-red-400">{errors.budget.message}</p>}

                <label className="block mt-4 mb-1 font-medium">Start Date</label>
                <input className="w-full p-2 border rounded" type="date" {...register('startDate')} />
                {errors.startDate && <p className="text-sm text-red-400">{errors.startDate.message}</p>}

                <label className="block mt-4">
                    <input className="mr-2" type="checkbox" {...register('terms')} />
                    I accept the terms and conditions
                </label>
                {errors.terms && <p className="text-sm text-red-400">{errors.terms.message}</p>}


                <button className="mt-6 bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
                    type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>
            </form>
        </main>
    );
}