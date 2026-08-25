use super::model::{NvidiaGpu, WindowsInventory};

const UNSUPPORTED_VALUES: [&str; 3] = ["", "N/A", "[Not Supported]"];

pub fn parse_windows_inventory(source: &str) -> Result<WindowsInventory, String> {
    let mut inventory: WindowsInventory =
        serde_json::from_str(source).map_err(|error| format!("invalid inventory JSON: {error}"))?;

    if let Some(board) = inventory.motherboard.as_mut() {
        board.bios_release_date = board
            .bios_release_date
            .as_deref()
            .and_then(parse_powershell_date);
    }

    Ok(inventory)
}

pub fn parse_powershell_date(value: &str) -> Option<String> {
    let trimmed = value.trim();
    if let Some(milliseconds) = trimmed
        .strip_prefix("/Date(")
        .and_then(|rest| rest.strip_suffix(")/"))
        .and_then(|number| number.split(['+', '-']).next())
        .and_then(|number| number.parse::<i64>().ok())
    {
        let days = milliseconds.div_euclid(86_400_000);
        let (year, month, day) = civil_from_days(days);
        return valid_date(year, month, day);
    }

    if trimmed.len() >= 10
        && trimmed.as_bytes().get(4) == Some(&b'-')
        && trimmed.as_bytes().get(7) == Some(&b'-')
    {
        let year = trimmed.get(0..4)?.parse().ok()?;
        let month = trimmed.get(5..7)?.parse().ok()?;
        let day = trimmed.get(8..10)?.parse().ok()?;
        return valid_date(year, month, day);
    }

    if trimmed.len() >= 8
        && trimmed
            .chars()
            .take(8)
            .all(|character| character.is_ascii_digit())
    {
        let year = trimmed.get(0..4)?.parse().ok()?;
        let month = trimmed.get(4..6)?.parse().ok()?;
        let day = trimmed.get(6..8)?.parse().ok()?;
        return valid_date(year, month, day);
    }

    None
}

pub fn parse_nvidia_csv(source: &str) -> Result<Vec<NvidiaGpu>, String> {
    source
        .lines()
        .filter(|line| !line.trim().is_empty())
        .enumerate()
        .map(|(index, line)| parse_nvidia_row(line, index + 1))
        .collect()
}

fn parse_nvidia_row(line: &str, line_number: usize) -> Result<NvidiaGpu, String> {
    let fields = split_csv_row(line)?;
    if fields.len() != 11 {
        return Err(format!(
            "invalid NVIDIA CSV at line {line_number}: expected 11 fields, got {}",
            fields.len()
        ));
    }

    let name = optional_text(&fields[2])
        .ok_or_else(|| format!("missing NVIDIA GPU name at line {line_number}"))?;

    Ok(NvidiaGpu {
        uuid: optional_text(&fields[0]),
        pci_bus_id: optional_text(&fields[1]),
        name,
        memory_total_mib: bounded_u64(&fields[3], 1, 16 * 1024 * 1024),
        temperature_c: bounded_f32(&fields[4], -50.0, 250.0),
        utilization_percent: bounded_f32(&fields[5], 0.0, 100.0),
        power_draw_w: bounded_f32(&fields[6], 0.0, 10_000.0),
        power_limit_w: bounded_f32(&fields[7], 0.0, 10_000.0),
        graphics_clock_mhz: bounded_u64(&fields[8], 0, 100_000).map(|value| value as u32),
        fan_speed_percent: bounded_f32(&fields[9], 0.0, 100.0),
        driver_version: optional_text(&fields[10]),
    })
}

fn split_csv_row(line: &str) -> Result<Vec<String>, String> {
    let mut fields = Vec::new();
    let mut current = String::new();
    let mut quoted = false;
    let mut characters = line.chars().peekable();

    while let Some(character) = characters.next() {
        match character {
            '"' if quoted && characters.peek() == Some(&'"') => {
                current.push('"');
                characters.next();
            }
            '"' => quoted = !quoted,
            ',' if !quoted => {
                fields.push(current.trim().to_string());
                current.clear();
            }
            _ => current.push(character),
        }
    }

    if quoted {
        return Err("unterminated quoted NVIDIA CSV field".to_string());
    }
    fields.push(current.trim().to_string());
    Ok(fields)
}

fn optional_text(value: &str) -> Option<String> {
    let trimmed = value.trim();
    (!UNSUPPORTED_VALUES.contains(&trimmed)).then(|| trimmed.to_string())
}

fn bounded_f32(value: &str, minimum: f32, maximum: f32) -> Option<f32> {
    let parsed = optional_text(value)?.parse::<f32>().ok()?;
    (parsed.is_finite() && (minimum..=maximum).contains(&parsed)).then_some(parsed)
}

fn bounded_u64(value: &str, minimum: u64, maximum: u64) -> Option<u64> {
    let parsed = optional_text(value)?.parse::<u64>().ok()?;
    (minimum..=maximum).contains(&parsed).then_some(parsed)
}

fn valid_date(year: i32, month: u32, day: u32) -> Option<String> {
    let leap = year % 4 == 0 && (year % 100 != 0 || year % 400 == 0);
    let maximum_day = match month {
        1 | 3 | 5 | 7 | 8 | 10 | 12 => 31,
        4 | 6 | 9 | 11 => 30,
        2 if leap => 29,
        2 => 28,
        _ => return None,
    };
    if year < 1970 || day == 0 || day > maximum_day {
        return None;
    }
    Some(format!("{year:04}-{month:02}-{day:02}"))
}

fn civil_from_days(days_since_epoch: i64) -> (i32, u32, u32) {
    let days = days_since_epoch + 719_468;
    let era = if days >= 0 { days } else { days - 146_096 } / 146_097;
    let day_of_era = days - era * 146_097;
    let year_of_era =
        (day_of_era - day_of_era / 1_460 + day_of_era / 36_524 - day_of_era / 146_096) / 365;
    let mut year = year_of_era + era * 400;
    let day_of_year = day_of_era - (365 * year_of_era + year_of_era / 4 - year_of_era / 100);
    let month_prime = (5 * day_of_year + 2) / 153;
    let day = day_of_year - (153 * month_prime + 2) / 5 + 1;
    let month = month_prime + if month_prime < 10 { 3 } else { -9 };
    year += i64::from(month <= 2);
    (year as i32, month as u32, day as u32)
}
