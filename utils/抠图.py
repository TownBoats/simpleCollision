import os
from rembg import remove
from PIL import Image
import numpy as np
import cv2
import io

def remove_background(input_path):
    """
    移除图像的背景，返回带透明背景的图像。
    
    :param input_path: 输入图片路径
    :return: PIL.Image 对象，已移除背景
    """
    with open(input_path, 'rb') as input_file:
        input_data = input_file.read()
    output_data = remove(input_data)
    output_image = Image.open(io.BytesIO(output_data)).convert("RGBA")
    return output_image

def crop_image(image, padding=10, force_square=True):
    """
    根据透明区域裁剪图像，并根据参数决定是否调整为方形。
    
    :param image: PIL.Image 对象，已移除背景的图像
    :param padding: 边界的额外填充像素数
    :param force_square: 是否强制调整为方形
    :return: 裁剪后的 PIL.Image 对象
    """
    image_np = np.array(image)
    alpha = image_np[:, :, 3]

    # 找到非透明区域的边界
    coords = cv2.findNonZero(alpha)
    if coords is not None:
        x, y, w, h = cv2.boundingRect(coords)
    else:
        print("无法检测到主体，返回原图。")
        return image

    # 添加填充
    left = max(x - padding, 0)
    upper = max(y - padding, 0)
    right = min(x + w + padding, image.width)
    lower = min(y + h + padding, image.height)

    # 裁剪框
    crop_box = (left, upper, right, lower)
    cropped_img = image.crop(crop_box)

    if force_square:
        # 确保裁剪后的图片为方形
        cropped_width, cropped_height = cropped_img.size
        if cropped_width != cropped_height:
            max_side = max(cropped_width, cropped_height)
            new_img = Image.new("RGBA", (max_side, max_side), (0, 0, 0, 0))
            paste_position = (
                (max_side - cropped_width) // 2,
                (max_side - cropped_height) // 2
            )
            new_img.paste(cropped_img, paste_position)
        else:
            new_img = cropped_img
        return new_img
    else:
        return cropped_img

def process_single_image(input_path, output_path, padding=10, force_square=True):
    """
    处理单个图片，移除背景并裁剪图像。
    
    :param input_path: 输入图片路径
    :param output_path: 输出图片路径
    :param padding: 裁剪时在主体周围添加的额外像素数
    :param force_square: 是否强制裁剪为方形
    """
    try:
        # 移除背景
        image = remove_background(input_path)
        
        # 裁剪图像
        cropped_image = crop_image(image, padding, force_square)
        
        # 保存结果
        cropped_image.save(output_path)
        print(f"成功处理: {input_path} -> {output_path}")
    except Exception as e:
        print(f"处理 {input_path} 时出错: {e}")

def process_directory(input_dir, output_dir, padding=10, force_square=True):
    """
    批量处理目录中的所有图片，移除背景并裁剪图像。
    
    :param input_dir: 输入图片所在的目录
    :param output_dir: 输出图片保存的目录
    :param padding: 裁剪时在主体周围添加的额外像素数
    :param force_square: 是否强制裁剪为方形
    """
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    supported_formats = ('.png', '.jpg', '.jpeg', '.bmp', '.tiff')
    for filename in os.listdir(input_dir):
        if filename.lower().endswith(supported_formats):
            input_path = os.path.join(input_dir, filename)
            base_name, _ = os.path.splitext(filename)
            output_filename = f"{base_name}.png"  # 输出为PNG以支持透明通道
            output_path = os.path.join(output_dir, output_filename)
            process_single_image(input_path, output_path, padding, force_square)

if __name__ == "__main__":
    # --------------------------- 参数设置开始 ---------------------------

    # 选择处理模式：'single' 处理单个文件，'batch' 批量处理目录
    mode = 'single'  # 'single' 或 'batch'

    # 如果选择 'single' 模式，设置以下参数
    single_input_path = "鸡腿.png"      # 输入图片路径
    single_output_path = "鸡腿-1.png"    # 输出图片路径

    # 如果选择 'batch' 模式，设置以下参数
    batch_input_directory = "input_images"    # 输入图片所在的目录
    batch_output_directory = "output_images"  # 输出图片保存的目录

    # 公共参数
    padding = 10          # 裁剪时在主体周围添加的额外像素数
    force_square = False   # 是否强制调整为方形

    # --------------------------- 参数设置结束 ---------------------------

    if mode == 'single':
        if not os.path.isfile(single_input_path):
            print(f"输入文件不存在: {single_input_path}")
        else:
            process_single_image(single_input_path, single_output_path, padding, force_square)
    elif mode == 'batch':
        if not os.path.isdir(batch_input_directory):
            print(f"输入目录不存在: {batch_input_directory}")
        else:
            process_directory(batch_input_directory, batch_output_directory, padding, force_square)
    else:
        print("无效的模式选择。请选择 'single' 或 'batch'。")
