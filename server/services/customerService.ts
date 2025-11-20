import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
// ...existing code...

export const listCustomers = async (filter: any) => {
    const { keyword, city } = filter;

    return await prisma.customer.findMany({
        where: {
            AND: [
                keyword
                    ? {
                          OR: [
                              { name: { contains: keyword, mode: "insensitive" } },
                              { email: { contains: keyword, mode: "insensitive" } },
                          ],
                      }
                    : {},

                city
                    ? { city: { contains: city, mode: "insensitive" } }
                    : {},
            ],
        },
        include: {
            orders: true, // JOIN để lấy số đơn hàng
        },
    });
};

export const getCustomerById = async (id: number) => {
    return await prisma.customer.findUnique({
        where: { id },
        include: {
            orders: true, // lấy lịch sử đơn
        },
    });
};
