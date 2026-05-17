# Bước 1: Sử dụng Nginx Alpine cho nhẹ
FROM nginx:stable-alpine

# Bước 2: Copy file cấu hình Nginx vừa viết ở trên vào đúng vị trí trong container
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Bước 3: Copy toàn bộ code vào thư mục mặc định của Nginx
# Lưu ý: Nếu bạn có thư mục 'dist', hãy sửa thành: COPY ./dist /usr/share/nginx/html
COPY . /usr/share/nginx/html

# Mở cổng 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]