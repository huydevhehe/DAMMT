import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { BarChart3, TrendingUp, Activity, Shield, Database, Zap } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-dashboard)" }}>
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="p-4 rounded-2xl bg-primary/10 animate-pulse">
              <BarChart3 className="w-12 h-12 text-primary" />
            </div>
            <TrendingUp className="w-8 h-8 text-secondary" />
            <Activity className="w-8 h-8 text-accent" />
          </div>

          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent leading-tight">
            Hệ thống Theo Dõi & Phân Tích
            <br />
            Tương Tác Người Dùng
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Thu thập, phân tích hành vi người dùng realtime với dashboard quản trị mạnh mẽ,
            heatmap visualization và bảo mật dữ liệu chuẩn 3NF
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Link to="/auth">
              <Button size="lg" className="text-lg px-8">
                Truy cập Dashboard
              </Button>
            </Link>
            <Link to="/demo">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Xem Demo Tracking
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6 pt-16">
            <div className="p-6 rounded-xl bg-card border hover:shadow-lg transition-all">
              <Zap className="w-10 h-10 text-primary mb-4 mx-auto" />
              <h3 className="font-bold text-lg mb-2">Realtime Analytics</h3>
              <p className="text-sm text-muted-foreground">
                Cập nhật dữ liệu trực tiếp qua WebSocket, không delay
              </p>
            </div>

            <div className="p-6 rounded-xl bg-card border hover:shadow-lg transition-all">
              <Database className="w-10 h-10 text-secondary mb-4 mx-auto" />
              <h3 className="font-bold text-lg mb-2">Database 3NF</h3>
              <p className="text-sm text-muted-foreground">
                Thiết kế cơ sở dữ liệu chuẩn, tối ưu và dễ mở rộng
              </p>
            </div>

            <div className="p-6 rounded-xl bg-card border hover:shadow-lg transition-all">
              <Shield className="w-10 h-10 text-accent mb-4 mx-auto" />
              <h3 className="font-bold text-lg mb-2">Bảo mật & Tuân thủ</h3>
              <p className="text-sm text-muted-foreground">
                RLS policies, mã hóa dữ liệu cá nhân, tuân thủ quy định
              </p>
            </div>
          </div>

          <div className="pt-16 text-sm text-muted-foreground space-y-2">
            <p>✓ Thu thập clicks, scrolls, form interactions</p>
            <p>✓ Heatmap visualization với độ phân giải cao</p>
            <p>✓ Session tracking và phân tích thời gian</p>
            <p>✓ Charts và metrics realtime</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
