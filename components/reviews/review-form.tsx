'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { reviewSchema, type ReviewInput } from '@/lib/validations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Star, Send } from 'lucide-react'
import { useToast } from '@/components/ui/toast'

interface ReviewFormProps {
    companyId: string
    companyName: string
    onSuccess?: () => void
}

export function ReviewForm({ companyId, companyName, onSuccess }: ReviewFormProps) {
    const { data: session } = useSession()
    const [rating, setRating] = useState(0)
    const [hoveredRating, setHoveredRating] = useState(0)
    const [submitting, setSubmitting] = useState(false)
    const { addToast } = useToast()

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue
    } = useForm<ReviewInput>({
        resolver: zodResolver(reviewSchema)
    })

    const onSubmit = async (data: ReviewInput) => {
        if (!session?.user) {
            addToast({
                type: 'error',
                title: 'Login necessário',
                message: 'Você precisa estar logado para avaliar uma empresa'
            })
            return
        }

        if (rating === 0) {
            addToast({
                type: 'error',
                title: 'Avaliação obrigatória',
                message: 'Por favor, selecione uma avaliação de 1 a 5 estrelas'
            })
            return
        }

        try {
            setSubmitting(true)

            const response = await fetch('/api/reviews', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...data,
                    rating,
                    companyId,
                }),
            })

            if (response.ok) {
                addToast({
                    type: 'success',
                    title: 'Avaliação enviada!',
                    message: 'Sua avaliação foi enviada e está sendo analisada'
                })

                reset()
                setRating(0)
                onSuccess?.()
            } else {
                const error = await response.json()
                addToast({
                    type: 'error',
                    title: 'Erro ao enviar avaliação',
                    message: error.message || 'Tente novamente mais tarde'
                })
            }
        } catch (error) {
            addToast({
                type: 'error',
                title: 'Erro ao enviar avaliação',
                message: 'Ocorreu um erro inesperado. Tente novamente.'
            })
        } finally {
            setSubmitting(false)
        }
    }

    const handleRatingClick = (value: number) => {
        setRating(value)
        setValue('rating', value)
    }

    if (!session?.user) {
        return (
            <Card>
                <CardContent className="p-6 text-center">
                    <p className="text-gray-600 mb-4">
                        Faça login para avaliar esta empresa
                    </p>
                    <Button>Fazer Login</Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Avaliar {companyName}</CardTitle>
                <p className="text-sm text-gray-600">
                    Compartilhe sua experiência com esta empresa
                </p>
            </CardHeader>

            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Rating Stars */}
                    <div>
                        <Label className="text-sm font-medium">Avaliação *</Label>
                        <div className="flex items-center space-x-1 mt-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => handleRatingClick(star)}
                                    onMouseEnter={() => setHoveredRating(star)}
                                    onMouseLeave={() => setHoveredRating(0)}
                                    className="focus:outline-none"
                                >
                                    <Star
                                        className={`w-8 h-8 transition-colors ${star <= (hoveredRating || rating)
                                            ? 'text-yellow-400 fill-current'
                                            : 'text-gray-300'
                                            }`}
                                    />
                                </button>
                            ))}
                            <span className="ml-2 text-sm text-gray-600">
                                {rating > 0 && (
                                    <>
                                        {rating} de 5 estrelas
                                        {rating === 1 && ' - Muito ruim'}
                                        {rating === 2 && ' - Ruim'}
                                        {rating === 3 && ' - Regular'}
                                        {rating === 4 && ' - Bom'}
                                        {rating === 5 && ' - Excelente'}
                                    </>
                                )}
                            </span>
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <Label htmlFor="title">Título da avaliação *</Label>
                        <Input
                            id="title"
                            placeholder="Resuma sua experiência em poucas palavras"
                            {...register('title')}
                            className="mt-1"
                        />
                        {errors.title && (
                            <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>
                        )}
                    </div>

                    {/* Comment */}
                    <div>
                        <Label htmlFor="comment">Comentário *</Label>
                        <Textarea
                            id="comment"
                            placeholder="Descreva sua experiência com esta empresa..."
                            rows={4}
                            {...register('comment')}
                            className="mt-1"
                        />
                        {errors.comment && (
                            <p className="text-red-600 text-sm mt-1">{errors.comment.message}</p>
                        )}
                    </div>

                    {/* Customer Info */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="customerName">Seu nome *</Label>
                            <Input
                                id="customerName"
                                placeholder="Como você gostaria de aparecer"
                                {...register('customerName')}
                                className="mt-1"
                            />
                            {errors.customerName && (
                                <p className="text-red-600 text-sm mt-1">{errors.customerName.message}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="customerLocation">Localização *</Label>
                            <Input
                                id="customerLocation"
                                placeholder="Cidade, Estado"
                                {...register('customerLocation')}
                                className="mt-1"
                            />
                            {errors.customerLocation && (
                                <p className="text-red-600 text-sm mt-1">{errors.customerLocation.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Project Type */}
                    <div>
                        <Label htmlFor="projectType">Tipo de projeto *</Label>
                        <select
                            id="projectType"
                            {...register('projectType')}
                            className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                        >
                            <option value="">Selecione o tipo de projeto</option>
                            <option value="Residencial">Residencial</option>
                            <option value="Comercial">Comercial</option>
                            <option value="Industrial">Industrial</option>
                            <option value="Rural">Rural</option>
                            <option value="Público">Público</option>
                        </select>
                        {errors.projectType && (
                            <p className="text-red-600 text-sm mt-1">{errors.projectType.message}</p>
                        )}
                    </div>

                    {/* Installation Date */}
                    <div>
                        <Label htmlFor="installationDate">Data da instalação (opcional)</Label>
                        <Input
                            id="installationDate"
                            type="date"
                            {...register('installationDate', {
                                valueAsDate: true
                            })}
                            className="mt-1"
                        />
                    </div>

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        disabled={submitting || rating === 0}
                        className="w-full"
                    >
                        {submitting ? (
                            'Enviando...'
                        ) : (
                            <>
                                <Send className="w-4 h-4 mr-2" />
                                Enviar Avaliação
                            </>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}