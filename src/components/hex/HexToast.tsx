import { toast } from 'sonner';

export const hexToast = {
  success: (message: string) =>
    toast.success(message, {
      style: {
        background: 'hsl(0 0% 6%)',
        border: '1px solid hsl(155 80% 45% / 0.3)',
        color: 'hsl(155 80% 60%)',
      },
    }),
  error: (message: string) =>
    toast.error(message, {
      style: {
        background: 'hsl(0 0% 6%)',
        border: '1px solid hsl(0 84% 60% / 0.3)',
        color: 'hsl(0 84% 70%)',
      },
    }),
};
