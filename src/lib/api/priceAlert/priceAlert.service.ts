import { PriceAlertParams } from './priceAlert.schema';
import { prisma } from '../../../utils/prisma';

export const PriceAlertService = {
  createAlert: async (params: PriceAlertParams, userId?: string) => {
    const tokenId = params.tokenId;
    const direction = params.direction;
    const value = params.value;
    
    let token = await prisma.token.findUnique({ where: { id: tokenId } });
    if (!token) {
      token = await prisma.token.create({ data: { id: tokenId, address: '' } });
    }

   
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new Error('No user found for alert creation');

    // Create Alert
    const alert = await prisma.alert.create({
      data: {
        userId: user.id,
        tokenId: token.id,
        enabled: true,
      },
    });

    const priceAlert = await prisma.priceAlert.create({
      data: {
        alertId: alert.id,
        direction,
        value,
      },
    });

    return { success: true, alert: { ...params, userId: user.id, alertId: alert.id, priceAlertId: priceAlert.id } };
  },
};
