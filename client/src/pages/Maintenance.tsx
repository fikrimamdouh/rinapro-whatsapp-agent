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
  Wrench,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  Package,
  Plus,
  Search,
  Download,
  TrendingUp,
  DollarSign,
} from "lucide-react";

export default function Maintenance() {
  const [activeTab, setActiveTab] = useState("requests");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  // Queries
  const { data: requests, refetch: refetchRequests } =
    trpc.maintenance.getRequests.useQuery();
  const { data: technicians } = trpc.maintenance.getTechnicians.useQuery();
  const { data: spareParts } = trpc.maintenance.getSpareParts.useQuery();
  const { data: stats } = trpc.maintenance.getStats.useQuery();

  // Mutations
  const updateRequestStatus = trpc.maintenance.updateRequestStatus.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث حالة الطلب");
      refetchRequests();
    },
  });

  const filteredRequests = requests?.filter((request) => {
    const matchesSearch =
      request.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.assetName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || request.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
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
      case "in_progress":
        return "قيد التنفيذ";
      case "completed":
        return "مكتمل";
      case "cancelled":
        return "ملغي";
      default:
        return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-orange-100 text-orange-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case "high":
        return "عالية";
      case "medium":
        return "متوسطة";
      case "low":
        return "منخفضة";
      default:
        return priority;
    }
  };

  return (
    <div className="min-h-screen bg-background p-6" dir="rtl">
      <div className="container mx-auto max-w-7xl">
        <BackToHome />

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Wrench className="h-10 w-10 text-primary" />
            إدارة الصيانة
          </h1>
          <p className="text-muted-foreground">
            إدارة طلبات الصيانة والفنيين وقطع الغيار
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي الطلبات</p>
                  <p className="text-2xl font-bold">{stats?.totalRequests || 0}</p>
                </div>
                <Wrench className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">قيد التنفيذ</p>
                  <p className="text-2xl font-bold">{stats?.inProgress || 0}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">مكتملة</p>
                  <p className="text-2xl font-bold">{stats?.completed || 0}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="requests">طلبات الصيانة</TabsTrigger>
            <TabsTrigger value="technicians">الفنيين</TabsTrigger>
            <TabsTrigger value="parts">قطع الغيار</TabsTrigger>
          </TabsList>

          {/* Maintenance Requests Tab */}
          <TabsContent value="requests" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>طلبات الصيانة</CardTitle>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4 ml-2" />
                      تصدير
                    </Button>
                    <Button size="sm">
                      <Plus className="h-4 w-4 ml-2" />
                      طلب جديد
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-4">
                  <div className="flex-1 relative">
                    <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="بحث برقم الطلب أو اسم الأصل..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pr-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الحالات</SelectItem>
                      <SelectItem value="pending">قيد الانتظار</SelectItem>
                      <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                      <SelectItem value="completed">مكتمل</SelectItem>
                      <SelectItem value="cancelled">ملغي</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="الأولوية" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الأولويات</SelectItem>
                      <SelectItem value="high">عالية</SelectItem>
                      <SelectItem value="medium">متوسطة</SelectItem>
                      <SelectItem value="low">منخفضة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  {filteredRequests?.map((request) => (
                    <Card key={request.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg">
                                {request.requestNumber}
                              </h3>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                  request.status
                                )}`}
                              >
                                {getStatusText(request.status)}
                              </span>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                                  request.priority
                                )}`}
                              >
                                {getPriorityText(request.priority)}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                              {request.issueDescription}
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-muted-foreground" />
                                <span>{request.assetName || "غير محدد"}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span>
                                  {request.technicianId ? `فني #${request.technicianId}` : "غير مخصص"}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>
                                  {request.scheduledDate
                                    ? new Date(request.scheduledDate).toLocaleDateString(
                                        "ar-SA"
                                      )
                                    : "غير محدد"}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                <span>
                                  {request.actualCost
                                    ? `${(request.actualCost / 100).toFixed(2)} ر.س`
                                    : `تقدير: ${(request.estimatedCost / 100).toFixed(2)} ر.س`}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {request.status === "pending" && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  updateRequestStatus.mutate({
                                    id: request.id,
                                    status: "in_progress",
                                  })
                                }
                              >
                                بدء العمل
                              </Button>
                            )}
                            {request.status === "in_progress" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  updateRequestStatus.mutate({
                                    id: request.id,
                                    status: "completed",
                                  })
                                }
                              >
                                إكمال
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {filteredRequests?.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>لا توجد طلبات صيانة</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Technicians Tab */}
          <TabsContent value="technicians" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>قائمة الفنيين</CardTitle>
                  <Button size="sm">
                    <Plus className="h-4 w-4 ml-2" />
                    فني جديد
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {technicians?.map((technician) => (
                    <Card key={technician.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{technician.name}</h3>
                            <p className="text-sm text-muted-foreground">{technician.phone}</p>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">التخصص:</span>
                            <span className="font-medium">{technician.specialization}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">عدد الأعمال:</span>
                            <span className="font-medium">{technician.totalJobs}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">التقييم:</span>
                            <span className="font-medium">
                              {technician.rating ? `${technician.rating}/5` : "لا يوجد"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">الحالة:</span>
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                technician.status === "active"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {technician.status === "active" ? "نشط" : "غير نشط"}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {technicians?.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                      <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>لا يوجد فنيين</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Spare Parts Tab */}
          <TabsContent value="parts" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>قطع الغيار</CardTitle>
                  <Button size="sm">
                    <Plus className="h-4 w-4 ml-2" />
                    قطعة جديدة
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {spareParts?.map((part) => (
                    <Card key={part.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Package className="h-8 w-8 text-blue-500" />
                              <div>
                                <h3 className="font-semibold">{part.partName}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {part.partNumber}
                                </p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-3">
                              <div>
                                <span className="text-muted-foreground">الفئة: </span>
                                <span className="font-medium">{part.category || "غير محدد"}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">الكمية: </span>
                                <span
                                  className={`font-medium ${
                                    part.quantity <= part.minStockLevel
                                      ? "text-red-600"
                                      : "text-green-600"
                                  }`}
                                >
                                  {part.quantity}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">السعر: </span>
                                <span className="font-medium">
                                  {(part.unitPrice / 100).toFixed(2)} ر.س
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">المورد: </span>
                                <span className="font-medium">{part.supplier || "غير محدد"}</span>
                              </div>
                            </div>
                          </div>
                          {part.quantity <= part.minStockLevel && (
                            <div className="flex items-center gap-2 text-red-600">
                              <AlertCircle className="h-5 w-5" />
                              <span className="text-sm font-medium">مخزون منخفض</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {spareParts?.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>لا توجد قطع غيار</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
