import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, MousePointer2, Eye, Clock } from "lucide-react";
import TrackingScript from "@/components/tracking/TrackingScript";

const TrackedPage = () => {
  return (
    <>
      <TrackingScript />
      <div className="min-h-screen" style={{ background: "var(--gradient-dashboard)" }}>
        <header className="border-b bg-card/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Activity className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Demo Tracking Page</h1>
                  <p className="text-sm text-muted-foreground">Trang demo với tracking tích hợp</p>
                </div>
              </div>
              <Button variant="outline" id="demo-button-1">
                Button Demo 1
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto space-y-8">
            <section className="text-center space-y-4">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Chào mừng đến với Demo Tracking
              </h2>
              <p className="text-lg text-muted-foreground">
                Mọi tương tác của bạn trên trang này đều được theo dõi và phân tích
              </p>
            </section>

            <div className="grid md:grid-cols-2 gap-6">
              <Card id="demo-card-1" className="hover:shadow-lg transition-all cursor-pointer">
                <CardHeader>
                  <MousePointer2 className="w-8 h-8 text-primary mb-2" />
                  <CardTitle>Theo dõi Click</CardTitle>
                  <CardDescription>
                    Mọi click của bạn đều được ghi nhận với vị trí chính xác
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" id="track-click-btn">
                    Click vào đây để test
                  </Button>
                </CardContent>
              </Card>

              <Card id="demo-card-2" className="hover:shadow-lg transition-all cursor-pointer">
                <CardHeader>
                  <Eye className="w-8 h-8 text-secondary mb-2" />
                  <CardTitle>Theo dõi Scroll</CardTitle>
                  <CardDescription>
                    Độ sâu scroll được đo và phân tích
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-20 overflow-y-scroll border rounded p-4">
                    <p>Scroll xuống để xem tracking hoạt động...</p>
                    <p className="mt-4">Thêm nội dung ở đây...</p>
                    <p className="mt-4">Và thêm nữa...</p>
                    <p className="mt-4">Cuối cùng!</p>
                  </div>
                </CardContent>
              </Card>

              <Card id="demo-card-3" className="hover:shadow-lg transition-all cursor-pointer">
                <CardHeader>
                  <Clock className="w-8 h-8 text-accent mb-2" />
                  <CardTitle>Theo dõi Session</CardTitle>
                  <CardDescription>
                    Thời gian bạn ở lại trang được tính toán
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Session ID:</span>
                      <span className="text-xs font-mono text-muted-foreground">Auto generated</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Tracking:</span>
                      <span className="text-xs text-success font-semibold">Active ●</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card id="demo-card-4" className="hover:shadow-lg transition-all cursor-pointer">
                <CardHeader>
                  <Activity className="w-8 h-8 text-success mb-2" />
                  <CardTitle>Realtime Analytics</CardTitle>
                  <CardDescription>
                    Dữ liệu được gửi realtime qua WebSocket
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="secondary" className="w-full" id="realtime-test-btn">
                    Test Realtime Update
                  </Button>
                </CardContent>
              </Card>
            </div>

            <section className="bg-card rounded-lg p-8 border">
              <h3 className="text-2xl font-bold mb-4">Form Demo</h3>
              <form className="space-y-4" id="demo-form">
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                    placeholder="your@email.com"
                    id="demo-email-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Message</label>
                  <textarea
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                    rows={4}
                    placeholder="Nhập tin nhắn..."
                    id="demo-message-input"
                  />
                </div>
                <Button type="submit" id="demo-submit-btn">
                  Submit Form (Tracked)
                </Button>
              </form>
            </section>

            <div className="text-center text-sm text-muted-foreground space-y-2">
              <p>✓ Tất cả events được mã hóa và bảo vệ</p>
              <p>✓ Tuân thủ quy định bảo mật dữ liệu cá nhân</p>
              <p>✓ Dữ liệu được lưu trữ theo chuẩn 3NF</p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default TrackedPage;
