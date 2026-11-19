import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../../config/prisma.js'
import { requireAuth, type AuthRequest } from '../../middleware/auth.middleware.js'

export const memoryRouter = Router()
memoryRouter.use(requireAuth)

// Metadata only. No source document bytes are downloaded or sent to any AI provider.
memoryRouter.get('/accounts', async (req: AuthRequest, res, next) => {
  try {
    const accounts = await prisma.connectedAccount.findMany({
      where: { userId: req.user!.id, provider: 'google_drive', status: 'connected' },
      include: { memoryIndexingSetting: true, _count: { select: { files: true } } },
      orderBy: { createdAt: 'asc' },
    })
    return res.json({ accounts: accounts.map((account) => ({
      id: account.id,
      email: account.email,
      displayName: account.displayName,
      indexingEnabled: account.memoryIndexingSetting?.enabled ?? false,
      metadataFileCount: account._count.files,
    })) })
  } catch (error) { return next(error) }
})

memoryRouter.put('/accounts/:id', async (req: AuthRequest, res, next) => {
  try {
    const body = z.object({ enabled: z.boolean() }).parse(req.body)
    const accountId = String(req.params.id)
    const account = await prisma.connectedAccount.findFirstOrThrow({
      where: { id: accountId, userId: req.user!.id, provider: 'google_drive', status: 'connected' },
      select: { id: true },
    })
    const setting = await prisma.memoryIndexingSetting.upsert({
      where: { connectedAccountId: account.id },
      create: { userId: req.user!.id, connectedAccountId: account.id, enabled: body.enabled },
      update: { userId: req.user!.id, enabled: body.enabled },
    })
    return res.json({ accountId: account.id, indexingEnabled: setting.enabled })
  } catch (error) { return next(error) }
})

// Lists existing 9Drive metadata for accounts with indexing explicitly enabled.
// Content indexing and text extraction are not part of this endpoint.
memoryRouter.get('/files', async (req: AuthRequest, res, next) => {
  try {
    const query = z.object({
      accountId: z.string().optional(),
      limit: z.coerce.number().int().min(1).max(200).default(100),
      offset: z.coerce.number().int().min(0).default(0),
    }).parse(req.query)
    const enabledSettings = await prisma.memoryIndexingSetting.findMany({
      where: { userId: req.user!.id, enabled: true, ...(query.accountId ? { connectedAccountId: query.accountId } : {}) },
      select: { connectedAccountId: true },
    })
    const accountIds = enabledSettings.map((setting) => setting.connectedAccountId)
    if (accountIds.length === 0) return res.json({ files: [], total: 0, limit: query.limit, offset: query.offset })
    const where = { userId: req.user!.id, connectedAccountId: { in: accountIds }, status: 'active' }
    const [files, total] = await Promise.all([
      prisma.file.findMany({ where, select: { id: true, connectedAccountId: true, name: true, mimeType: true, sizeBytes: true, createdAt: true, updatedAt: true }, orderBy: { updatedAt: 'desc' }, take: query.limit, skip: query.offset }),
      prisma.file.count({ where }),
    ])
    return res.json({ files: files.map(file => ({ ...file, sizeBytes: file.sizeBytes.toString() })), total, limit: query.limit, offset: query.offset })
  } catch (error) { return next(error) }
})
