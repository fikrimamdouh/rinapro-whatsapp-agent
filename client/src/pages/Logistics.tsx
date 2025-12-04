import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { BackToHome } from "@/components/BackToHome";
import {
  Truck,
  Package,
  MapPin,
  Calendar,
  DollarSign,
  User,
  Plus,
  Search,
  Download,
  TrendingUp,
} from "lucide-react";

export default function Logistics() {
  const [activeTab, setActiveTab] = useState("shipments");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Queries
  const { data: shipments, refetch: refetchShipments } = trpc.logistics.getShipments.useQuery();
  const { data: drivers } = trpc.logistics.getDrivers.useQuery();
  const { data: vehicles } = trpc.logistics.getVehicles.useQuery();
  const { data: stats } = trpc.logistics.getStats.useQuery();

  // Mutations
  const updateShipmentStatus = trpc.logistics.updateShipmentStatus.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث حالة الشحنة");
      refetchShipments();
    },
  });

  const filteredShipments = shipments?.filter((shipment) => {
    const matchesSearch =
      shipment.shipmentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || shipment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "in_transit":
        return "bg-blue-100 text-blue-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "قيد الانتظار";
      case "in_transit":
        return "قيد التوصيل";
      case "delivered":
        return "تم التوصيل";
      case "cancelled":
        return "ملغي";
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-background p-6" dir="rtl">
      <div className="container mx-auto max-w-7xl">
        <BackToHome />

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Truck className="h-10 w-10 text-primary" />
            إدارة اللوجستيات
          </h1>
          <p className="text-muted-foreground">
            إدارة الشحنات والتوصيل والسائقين والمركبات
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي الشحنات</p>
                  <p className="text-2xl font-bold">{stats?.totalShipments || 0}</p>
                </div>
                <Package className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">قيد التوصيل</p>
                  <p className="text-2xl font-bold">{stats?.inTransit || 0}</p>
                </div>
                <Truck className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">تم التوصيل</p>
                  <p className="text-2xl font-bold">{stats?.delivered || 0}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي التكاليف</p>
                  <p className="text-2xl font-bold">
                    {((stats?.totalCost || 0) / 100).toFixed(2)} ر.س
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="shipments">الشحنات</TabsTrigger>
            <TabsTrigger value="drivers">السائقين</TabsTrigger>
            <TabsTrigger value="vehicles">المركبات</TabsTrigger>
            <TabsTrigger value="routes">المسارات</TabsTrigger>
          </TabsList>

          {/* Shipments Tab */}
          <TabsContent value="shipments" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>قائمة الشحنات</CardTitle>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4 ml-2" />
                      تصدير
                    </Button>
                    <Button size="sm">
                      <Plus className="h-4 w-4 ml-2" />
                      شحنة جديدة
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-4">
                  <div className="flex-1 relative">
                    <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="بحث برقم الشحنة أو اسم العميل..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pr-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الحالات</SelectItem>
                      <SelectItem value="pending">قيد الانتظار</SelectItem>
                      <SelectItem value="in_transit">قيد التوصيل</SelectItem>
                      <SelectItem value="delivered">تم التوصيل</SelectItem>
                      <SelectItem value="cancelled">ملغي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  {filteredShipments?.map((shipment) => (
                    <Card key={shipment.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg">
                                {shipment.shipmentNumber}
                              </h3>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                  shipment.status
                                )}`}
                              >
                                {getStatusText(shipment.status)}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span>{shipment.customerName || "غير محدد"}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span>{shipment.destination || "غير محدد"}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span>
                                  {shipment.scheduledDate
                                    ? new Date(shipment.scheduledDate).toLocaleDateString(
                                        "ar-SA"
                                      )
                                    : "غير محدد"}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                <span>{(shipment.totalCost / 100).toFixed(2)} ر.س</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {shipment.status === "pending" && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  updateShipmentStatus.mutate({
                                    id: shipment.id,
                                    status: "in_transit",
                                  })
                                }
                              >
                                بدء التوصيل
                              </Button>
                            )}
                            {shipment.status === "in_transit" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  updateShipmentStatus.mutate({
                                    id: shipment.id,
                                    status: "delivered",
                                  })
                                }
                              >
                                تأكيد التوصيل
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {filteredShipments?.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>لا توجد شحنات</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Drivers Tab */}
          <TabsContent value="drivers" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>قائمة السائقين</CardTitle>
                  <Button size="sm">
                    <Plus className="h-4 w-4 ml-2" />
                    سائق جديد
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {drivers?.map((driver) => (
                    <Card key={driver.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{driver.name}</h3>
                            <p className="text-sm text-muted-foreground">{driver.phone}</p>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">رقم الرخصة:</span>
                            <span className="font-medium">{driver.licenseNumber}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">عدد التوصيلات:</span>
                            <span className="font-medium">{driver.totalDeliveries}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">التقييم:</span>
                            <span className="font-medium">
                              {driver.rating ? `${driver.rating}/5` : "لا يوجد"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">الحالة:</span>
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                driver.status === "active"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {driver.status === "active" ? "نشط" : "غير نشط"}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {drivers?.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                      <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>لا يوجد سائقين</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vehicles Tab */}
          <TabsContent value="vehicles" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>قائمة المركبات</CardTitle>
                  <Button size="sm">
                    <Plus className="h-4 w-4 ml-2" />
                    مركبة جديدة
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {vehicles?.map((vehicle) => (
                    <Card key={vehicle.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <Truck className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{vehicle.plateNumber}</h3>
                            <p className="text-sm text-muted-foreground">{vehicle.model}</p>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">السنة:</span>
                            <span className="font-medium">{vehicle.year}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">الحمولة:</span>
                            <span className="font-medium">{vehicle.capacity} كجم</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">الحالة:</span>
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                vehicle.status === "active"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {vehicle.status === "active" ? "نشط" : "غير نشط"}
                            </span>
                          </div>
                          {vehicle.nextMaintenanceDate && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">الصيانة القادمة:</span>
                              <span className="font-medium text-xs">
                                {new Date(vehicle.nextMaintenanceDate).toLocaleDateString(
                                  "ar-SA"
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {vehicles?.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                      <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>لا توجد مركبات</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Routes Tab */}
          <TabsContent value="routes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>تحسين المسارات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>قريباً: تحسين المسارات باستخدام الذكاء الاصطناعي</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
