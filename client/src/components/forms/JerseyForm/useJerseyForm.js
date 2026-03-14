import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  teamName: z.string().min(1, 'Takım adı zorunlu'),
  country: z.string().optional(),
  league: z.string().optional(),
  season: z.string().optional(),
  type: z.string().optional(),
  quality: z.string().optional(),
  brand: z.string().optional(),
  technology: z.string().optional(),
  size: z.string().optional(),
  sponsor: z.string().optional(),
  productCode: z.string().optional(),
  condition: z.string().optional(),
  primaryColor: z.string().optional(),
  detailColor: z.string().optional(),
  buyPrice: z.coerce.number().min(0).optional(),
  sellPrice: z.coerce.number().min(0).optional(),
  stockCount: z.coerce.number().min(0).default(1),
  status: z.enum(['for_sale', 'not_for_sale']).default('for_sale'),
  notes: z.string().optional(),
  purchaseDate: z.string().optional(),
  measurements: z.object({
    armpit: z.coerce.number().min(0).optional(),
    length: z.coerce.number().min(0).optional(),
  }).optional(),
  printing: z.object({
    hasNumber: z.boolean().default(false),
    number: z.string().optional(),
    playerName: z.string().optional(),
  }).optional(),
});

export function useJerseyForm(defaultValues = {}) {
  return useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      stockCount: 1,
      status: 'for_sale',
      buyPrice: 0,
      sellPrice: 0,
      measurements: {},
      printing: { hasNumber: false },
      ...defaultValues,
    },
  });
}
